"use client";

import { useAppKit } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BaseError, ContractFunctionRevertedError, formatEther, formatUnits, parseAbi, type Hash, type Hex } from "viem";
import { useConnection, usePublicClient, useSignMessage, useSwitchChain, useWalletClient, useWriteContract } from "wagmi";
import { CONTACT_EMAIL, MINT_CHAIN, explorerTx } from "@/lib/chains";
import type { PublicConfig } from "@/lib/config-types";
import type { DevconProof } from "@/lib/devcon/types";
import { amount, api, usd } from "@/lib/format";
import { NO_VOUCHER, REGISTRAR_ABI, type Voucher } from "@/lib/registrar";
import type { IssuedVoucher } from "@/lib/server/registrar";
import { DevconDrop } from "./devcon-drop";
import { assertSafeToSend } from "./fork-guard";
import { Confetti, DrawnCheck, Spinner } from "./motion";

type Availability = { ok: true; label: string; name: string } | { ok: false; label?: string; reason: string; retryable?: boolean };

// approve without a return value: mainnet USDT returns nothing.
const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 value)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const PENDING_KEY = "pending-claim";

type Pending = { label: string; hash: Hash };
type Step = null | "quote" | "approve" | "wallet" | "mining";
type ReviewState = { label: string; voucher: IssuedVoucher | null; wei: bigint | null };

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function friendlyError(e: unknown): string {
  if (e instanceof BaseError) {
    const r = e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null;
    const name = r?.data?.errorName;
    const map: Record<string, string> = {
      NameTaken: "Someone just claimed this name",
      NameReserved: "This name is reserved",
      NameLocked: "This name was recently revoked and is locked for now",
      CouponUnusable: "That code can no longer be used",
      TicketUnusable: "This ticket or wallet has already claimed a Devcon name",
      Underpaid: "The ETH price moved; please try again",
      VoucherExpired: "The discount expired; review again",
      StalePrice: "The ETH price feed is out of date; pay with a stablecoin or try again later",
    };
    if (name && map[name]) return map[name];
    const msg = e.shortMessage || e.message;
    if (/reject|denied|cancel/i.test(msg)) return "You cancelled the request in your wallet";
    if (/insufficient funds|exceeds balance|transfer amount exceeds/i.test(msg)) return "Not enough balance in your wallet for this payment plus gas";
    if (/ERC1155|Receiver/i.test(msg)) return "Your wallet can't receive ENS names (a smart account without ERC-1155 support). Try another wallet.";
    return msg.split("\n")[0];
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

export function Claim() {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useConnection();
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api<PublicConfig>("/api/config") });

  const [input, setInput] = useState("");
  const [pay, setPay] = useState("ETH");
  const [coupon, setCoupon] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [devcon, setDevcon] = useState<DevconProof | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [step, setStep] = useState<Step>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [done, setDone] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label = useDebounced(input.trim().toLowerCase(), 350);
  const check = useQuery({
    queryKey: ["check", label],
    queryFn: () => api<Availability>(`/api/check?name=${encodeURIComponent(label)}`),
    enabled: label.length > 0 && !review && !done,
    staleTime: 10_000,
  });

  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();

  // Prefill ?name= and resume a transaction that was in flight when the page closed.
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("name");
    if (preset) setInput(preset.replace(/[^\p{L}\p{N}\p{Emoji}-]/gu, "").slice(0, 63)); // eslint-disable-line react-hooks/set-state-in-effect
    try {
      const p = JSON.parse(localStorage.getItem(PENDING_KEY) || "null") as Pending | null;
      if (p?.hash) setPending(p);
    } catch {}
  }, []);

  useEffect(() => {
    if (!pending || !client) return;
    let cancelled = false;
    client
      .waitForTransactionReceipt({ hash: pending.hash, timeout: 10 * 60_000 })
      .then((r) => {
        if (cancelled) return;
        if (r.status === "success") setDone(pending);
        else setError("The transaction failed on-chain; only gas was spent.");
      })
      .catch(() => !cancelled && setError("Couldn't confirm the transaction yet; check your wallet's activity."))
      .finally(() => {
        if (cancelled) return;
        setPending(null);
        setStep(null);
        try {
          localStorage.removeItem(PENDING_KEY);
        } catch {}
      });
    return () => {
      cancelled = true;
    };
  }, [pending, client]);

  // Switching wallets invalidates a review made for the previous one.
  const ownerRef = useRef(address);
  useEffect(() => {
    if (ownerRef.current && address !== ownerRef.current) setReview(null);
    ownerRef.current = address;
  }, [address]);

  const token = config?.tokens.find((t) => t.symbol === pay);
  const priceCents = config?.priceCents ?? 99;

  async function startReview() {
    setError(null);
    if (!isConnected || !address) return open({ view: "Connect" });
    if (!config || !client) return;
    setStep("quote");
    try {
      let voucher: IssuedVoucher | null = null;
      if (devcon || coupon.trim()) {
        voucher = await api<IssuedVoucher>("/api/voucher", {
          method: "POST",
          json: { label: input, owner: address, coupon: devcon ? undefined : coupon, devcon: devcon ?? undefined },
        });
      }
      const cents = voucher ? voucher.priceCents : priceCents;
      const wei =
        voucher?.sponsored || token
          ? null
          : await client.readContract({ address: config.registrar, abi: REGISTRAR_ABI, functionName: "quoteWei", args: [BigInt(cents)] });
      setReview({ label: voucher?.label ?? (check.data?.ok ? check.data.label : input.trim().toLowerCase()), voucher, wei });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't prepare your order");
    } finally {
      setStep(null);
    }
  }

  async function confirm() {
    if (!review || !address || !config || !client) return;
    setError(null);
    const v = review.voucher;
    const voucher: Voucher = v ? { ...v.voucher, deadline: BigInt(v.voucher.deadline) } : NO_VOUCHER(review.label, address);
    const sig: Hex = v ? v.signature : "0x";
    try {
      await assertSafeToSend(config, walletClient);
      let hash: Hash;
      if (v?.sponsored) {
        // Sponsored: prove wallet ownership with a free signature; the relayer sends the mint.
        setStep("wallet");
        const ownerSignature = await signMessageAsync({ message: v.claimMessage! });
        setStep("mining");
        hash = (
          await api<{ txHash: Hash }>("/api/claim", {
            method: "POST",
            json: { label: review.label, voucher: v.voucher, signature: v.signature, ownerSignature },
          })
        ).txHash;
      } else {
        if (chainId !== MINT_CHAIN.id) await switchChainAsync({ chainId: MINT_CHAIN.id });
        if (token) {
          const cents = v ? v.priceCents : priceCents;
          const due = (BigInt(cents) * BigInt(10) ** BigInt(token.decimals)) / BigInt(100);
          if (due > BigInt(0)) {
            const allowance = await client.readContract({ address: token.address, abi: ERC20_ABI, functionName: "allowance", args: [address, config.registrar] });
            if (allowance < due) {
              setStep("approve");
              // USDT refuses to change a non-zero allowance directly, so reset it first.
              if (allowance > BigInt(0) && token.symbol === "USDT") {
                const h0 = await writeContractAsync({ chainId: MINT_CHAIN.id, address: token.address, abi: ERC20_ABI, functionName: "approve", args: [config.registrar, BigInt(0)] });
                await client.waitForTransactionReceipt({ hash: h0 });
              }
              const h = await writeContractAsync({ chainId: MINT_CHAIN.id, address: token.address, abi: ERC20_ABI, functionName: "approve", args: [config.registrar, due] });
              await client.waitForTransactionReceipt({ hash: h });
            }
          }
          setStep("wallet");
          hash = await writeContractAsync({
            chainId: MINT_CHAIN.id,
            address: config.registrar,
            abi: REGISTRAR_ABI,
            functionName: "registerWithToken",
            args: [review.label, address, token.address, voucher, sig],
          });
        } else {
          setStep("wallet");
          // A little extra covers price movement until the tx lands; the contract returns any excess.
          const value = review.wei ? (review.wei * BigInt(1005)) / BigInt(1000) : BigInt(0);
          hash = await writeContractAsync({
            chainId: MINT_CHAIN.id,
            address: config.registrar,
            abi: REGISTRAR_ABI,
            functionName: "registerWithETH",
            args: [review.label, address, voucher, sig],
            value,
          });
        }
      }
      setStep("mining");
      const p = { label: review.label, hash };
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify(p));
      } catch {}
      setPending(p);
    } catch (e) {
      setError(friendlyError(e));
      setStep(null);
    }
  }

  function reset() {
    setReview(null);
    setDone(null);
    setError(null);
    setInput("");
    setDevcon(null);
    setCoupon("");
  }

  const phase: "form" | "review" | "progress" | "done" = done ? "done" : pending || step === "mining" ? "progress" : review ? "review" : "form";
  const typedName = input.trim().toLowerCase().replace(/\.isworking\.eth$/, "");
  const avail = label && check.data && check.data.label === label.replace(/\.isworking\.eth$/, "") ? check.data : null;
  const devconFree = !!devcon && !!config?.devcon.sponsorGas;

  return (
    <div className="card relative mx-auto w-full max-w-xl p-2">
      <Confetti fire={phase === "done"} />
      <AnimatePresence mode="wait" initial={false}>
        {phase === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (avail?.ok) startReview();
              }}
            >
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <div className="flex items-center rounded-xl bg-bg-soft pr-3 transition-shadow focus-within:ring-2 focus-within:ring-accent">
                <input
                  id="name"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value.replace(/\s/g, ""));
                    setError(null);
                  }}
                  placeholder="yourname"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  maxLength={63}
                  className="h-14 min-w-0 flex-1 bg-transparent pl-4 font-mono text-lg text-fg-strong outline-none placeholder:text-faint sm:text-xl"
                />
                <span className="font-mono text-lg text-muted sm:text-xl">.isworking.eth</span>
              </div>

              <div className="flex min-h-9 items-center px-2 pt-2 text-sm">
                {typedName && (check.isFetching || typedName !== label) ? (
                  <span className="flex items-center gap-2 text-muted">
                    <Spinner className="size-3.5" /> Checking…
                  </span>
                ) : avail?.ok ? (
                  <span className="pill bg-ok-soft text-ok">
                    <span className="size-1.5 rounded-full bg-ok" /> {avail.name} is available
                  </span>
                ) : avail && !avail.ok ? (
                  <span className={`pill ${avail.retryable ? "bg-warn-soft text-warn" : "bg-bad-soft text-bad"}`}>{avail.reason}</span>
                ) : check.isError ? (
                  <span className="pill bg-warn-soft text-warn">Couldn&apos;t check right now</span>
                ) : (
                  <span className="text-muted">{usd(priceCents / 100)} once + gas · yours on-chain, permanently</span>
                )}
              </div>

              <AnimatePresence initial={false}>
                {avail?.ok && typedName === label && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-5 px-2 pt-3 pb-2">
                      {!devconFree && (
                        <div>
                          <span className="label">Pay with (on Ethereum)</span>
                          <div className="flex flex-wrap gap-2">
                            {["ETH", ...(config?.tokens.map((t) => t.symbol) ?? [])].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setPay(s)}
                                className={`h-9 rounded-lg border px-3.5 text-sm transition-colors ${pay === s ? "border-accent bg-accent-soft text-fg-strong" : "border-border bg-card-solid text-muted hover:text-fg-strong"}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {config?.devcon.enabled && <DevconDrop policy={config.devcon} onProof={setDevcon} />}

                      {!devcon && (
                        <div>
                          {showCoupon ? (
                            <div>
                              <label className="label" htmlFor="coupon">
                                Coupon code
                              </label>
                              <input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="CODE" className="input font-mono uppercase" autoComplete="off" />
                            </div>
                          ) : (
                            <button type="button" onClick={() => setShowCoupon(true)} className="text-sm text-muted hover:text-fg-strong">
                              Have a coupon code?
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                        <div className="text-sm">
                          <p className="text-fg-strong">
                            {devcon ? (
                              <>
                                <s className="text-faint">{usd(priceCents / 100)}</s> {usd((priceCents * (100 - (config?.devcon.percentOff ?? 100))) / 10000)}
                              </>
                            ) : (
                              usd(priceCents / 100)
                            )}{" "}
                            <span className="text-muted">{devconFree ? "· gas on us" : "+ gas"}</span>
                          </p>
                          <p className="text-xs text-muted">{coupon && !devcon ? "Coupon applied at review" : "Final price on the next step"}</p>
                        </div>
                        <button type="submit" className="btn-primary min-w-36" disabled={step !== null}>
                          {step === "quote" ? <Spinner /> : !isConnected ? "Connect wallet" : "Review"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {error && <p className="px-2 pb-2 text-sm text-bad">{error}</p>}
            </form>
          </motion.div>
        )}

        {phase === "review" && review && config && (
          <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-3 sm:p-4">
            <Review review={review} config={config} token={token} onBack={() => setReview(null)} onConfirm={confirm} step={step} error={error} />
          </motion.div>
        )}

        {phase === "progress" && (
          <motion.div key="progress" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 text-center">
            <Spinner className="mx-auto size-6 text-accent" />
            <p className="mt-4 font-mono text-lg break-all text-fg-strong">{(pending?.label ?? review?.label) + ".isworking.eth"}</p>
            <p className="mt-1 text-sm text-muted">Minting on Ethereum… this usually takes under a minute. You can close this page.</p>
            {pending && (
              <a className="link mt-3 inline-block text-xs" href={explorerTx(MINT_CHAIN.id, pending.hash)} target="_blank" rel="noreferrer">
                View transaction
              </a>
            )}
          </motion.div>
        )}

        {phase === "done" && done && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="p-4 py-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok text-bg">
              <DrawnCheck className="size-7" />
            </div>
            <p className="mt-4 text-sm text-muted">It&apos;s yours</p>
            <h2 className="mt-1 font-mono text-2xl break-all text-fg-strong">{done.label}.isworking.eth</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Now go build good things. Set it as your primary name so apps show it instead of your address.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a className="btn-primary" href={`https://app.ens.domains/${done.label}.isworking.eth`} target="_blank" rel="noreferrer">
                Open in ENS
              </a>
              <a
                className="btn-secondary"
                href={`https://x.com/intent/post?text=${encodeURIComponent(`I just got ${done.label}.isworking.eth 🛠️\n\nGet yours at`)}&url=${encodeURIComponent(`https://get.isworking.dev/n/${done.label}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Share
              </a>
            </div>
            <div className="mt-5 flex justify-center gap-4 text-xs">
              <a className="link" href={explorerTx(MINT_CHAIN.id, done.hash)} target="_blank" rel="noreferrer">
                Transaction
              </a>
              <button type="button" className="text-muted hover:text-fg-strong" onClick={reset}>
                Get another name
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {phase !== "form" && phase !== "review" && error && (
        <p className="px-4 pb-4 text-center text-sm text-bad">
          {error} Questions?{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: React.ReactNode; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 ${strong ? "text-fg-strong" : "text-muted"}`}>
      <span>{k}</span>
      <span className={`text-right tabular-nums ${strong ? "font-semibold" : "text-fg"}`}>{v}</span>
    </div>
  );
}

function Review({
  review,
  config,
  token,
  onBack,
  onConfirm,
  step,
  error,
}: {
  review: ReviewState;
  config: PublicConfig;
  token: PublicConfig["tokens"][number] | undefined;
  onBack: () => void;
  onConfirm: () => void;
  step: Step;
  error: string | null;
}) {
  const v = review.voucher;
  const cents = v ? v.priceCents : config.priceCents;
  const free = !!v?.sponsored;
  const payAmount = free
    ? null
    : token
      ? `${amount(formatUnits((BigInt(cents) * BigInt(10) ** BigInt(token.decimals)) / BigInt(100), token.decimals))} ${token.symbol}`
      : `${amount(Number(formatEther(review.wei ?? BigInt(0))).toFixed(6))} ETH`;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Review</p>
          <h2 className="mt-1 font-mono text-xl break-all text-fg-strong sm:text-2xl">{review.label}.isworking.eth</h2>
          <p className="mt-1 text-sm text-muted">Yours permanently, minted on Ethereum</p>
        </div>
        <button type="button" onClick={onBack} className="btn-ghost -mr-2" disabled={step !== null}>
          Edit
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-bg-soft px-4 py-2 text-sm">
        <Row k="Name (one-time)" v={usd(config.priceCents / 100)} />
        {v && v.percentOff > 0 && (
          <Row k={v.code?.startsWith("DEVCON8_") ? `Devcon 8 · ${v.code}` : `Coupon ${v.code}`} v={<span className="text-ok">−{v.percentOff}%</span>} />
        )}
        <Row k="Network fee (gas)" v={free ? <span className="text-ok">sponsored</span> : "paid in your wallet"} />
        <div className="my-1 border-t border-border" />
        <Row
          strong
          k="Total"
          v={
            free ? (
              "Free"
            ) : cents === 0 ? (
              "Just gas"
            ) : (
              <>
                {payAmount} <span className="block text-xs font-normal text-muted">≈ {usd(cents / 100)}</span>
              </>
            )
          }
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {free
          ? "Sponsored: the name and the gas are on us. You'll sign a message to prove you own this wallet; it's free and sends no transaction."
          : `One transaction pays the isworking.eth wallet and mints the name to you${token ? "" : "; any ETH beyond the price is returned automatically"}.${token && cents > 0 ? ` First, your wallet asks you to allow the ${token.symbol} payment.` : ""}`}
      </p>

      {error && <p className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

      <button type="button" onClick={onConfirm} className="btn-primary mt-5 w-full" disabled={step !== null}>
        {step === "approve" ? (
          <>
            <Spinner /> Allow {token?.symbol} in your wallet…
          </>
        ) : step === "wallet" ? (
          <>
            <Spinner /> Confirm in your wallet…
          </>
        ) : free ? (
          "Sign & claim"
        ) : cents === 0 ? (
          "Claim (pay gas only)"
        ) : (
          `Pay ${payAmount}`
        )}
      </button>
    </div>
  );
}
