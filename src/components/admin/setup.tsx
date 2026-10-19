"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { isAddressEqual, type Address, type Hash } from "viem";
import { useConnection, useDeployContract, usePublicClient, useSwitchChain } from "wagmi";
import { MINT_CHAIN, explorerAddress, explorerTx } from "@/lib/chains";
import { ENS_REGISTRY, NAME_WRAPPER, NAME_WRAPPER_ABI, PARENT_NODE, PUBLIC_RESOLVER } from "@/lib/ens";
import { api, shortAddress } from "@/lib/format";
import { ETH_USD_FEED, REGISTRAR_ABI, REGISTRAR_ADDRESS, STABLECOINS } from "@/lib/registrar";
import { REGISTRAR_BYTECODE } from "@/lib/registrar-artifact";
import { DrawnCheck, Spinner } from "../motion";
import { Notice, Section, Toggle } from "./ui";
import { useRegistrar } from "./use-registrar";

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-4 py-4">
      <span className={`grid size-7 shrink-0 place-items-center rounded-full border text-sm ${done ? "border-ok bg-ok text-bg" : "border-border-strong text-muted"}`}>
        {done ? <DrawnCheck className="size-4" /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg-strong">{title}</p>
        <div className="mt-1 text-sm text-muted">{children}</div>
      </div>
    </li>
  );
}

const DEPLOYED_KEY = "registrar-just-deployed";

export function SetupTab({ admin }: { admin: Address }) {
  const qc = useQueryClient();
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const { chainId } = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const { deployContractAsync } = useDeployContract();
  const { send, busy, error, setError, lastTx } = useRegistrar();
  const [deploying, setDeploying] = useState(false);
  const [deployTx, setDeployTx] = useState<Hash | null>(null);
  const [justDeployed, setJustDeployed] = useState<Address | null>(() => {
    try {
      return (localStorage.getItem(DEPLOYED_KEY) as Address | null) || null;
    } catch {
      return null;
    }
  });

  const registrar = REGISTRAR_ADDRESS ?? justDeployed;
  const relayer = useQuery({ queryKey: ["relayer"], queryFn: () => api<{ address: Address; balanceEth: string }>("/api/relayer") });
  const status = useQuery({
    queryKey: ["setup-status", registrar],
    enabled: !!client && !!registrar,
    queryFn: async () => {
      const r = (fn: string, args: unknown[] = []) => client!.readContract({ address: registrar!, abi: REGISTRAR_ABI, functionName: fn, args } as never);
      const [approved, onchainRelayer, treasury, decimals] = await Promise.all([
        client!.readContract({ address: NAME_WRAPPER, abi: NAME_WRAPPER_ABI, functionName: "isApprovedForAll", args: [admin, registrar!] }),
        r("relayer") as Promise<Address>,
        r("treasury") as Promise<Address>,
        Promise.all(STABLECOINS.map((t) => r("tokenDecimals", [t.address]) as Promise<number>)),
      ]);
      return { approved, relayer: onchainRelayer, treasury, tokens: STABLECOINS.map((t, i) => ({ ...t, on: Number(decimals[i]) > 0 })) };
    },
  });

  async function deploy() {
    if (!relayer.data) return;
    setDeploying(true);
    setError(null);
    try {
      if (chainId !== MINT_CHAIN.id) await switchChainAsync({ chainId: MINT_CHAIN.id });
      const hash = await deployContractAsync({
        chainId: MINT_CHAIN.id,
        abi: REGISTRAR_ABI,
        bytecode: REGISTRAR_BYTECODE,
        args: [NAME_WRAPPER, ENS_REGISTRY, PUBLIC_RESOLVER, PARENT_NODE, ETH_USD_FEED, admin, relayer.data.address],
      });
      setDeployTx(hash);
      const receipt = await client!.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) throw new Error("Deployment failed");
      setJustDeployed(receipt.contractAddress);
      try {
        localStorage.setItem(DEPLOYED_KEY, receipt.contractAddress);
      } catch {}
      await qc.invalidateQueries();
    } catch (e) {
      const msg = (e as { shortMessage?: string; message?: string }).shortMessage || (e as Error).message;
      setError(/reject|denied/i.test(msg) ? "You cancelled the transaction" : msg.split("\n")[0]);
    } finally {
      setDeploying(false);
    }
  }

  const s = status.data;
  const low = relayer.data && Number(relayer.data.balanceEth) < 0.003;
  const relayerOk = !!s && !!relayer.data && isAddressEqual(s.relayer, relayer.data.address);
  const ready = !!REGISTRAR_ADDRESS && !!s?.approved && relayerOk;

  return (
    <div className="space-y-4">
      {ready ? (
        <Notice tone="ok">Minting is live: the registrar is deployed, approved and wired to this app&apos;s relayer.</Notice>
      ) : (
        <Notice tone="warn">Minting isn&apos;t live yet. Finish the steps below.</Notice>
      )}

      <Section
        title="Setup"
        desc="Names are sold by a registrar contract you deploy and approve once. Payments go straight to your treasury; it can only create or revoke isworking.eth subnames and can't move isworking.eth."
      >
        <ol className="divide-y divide-border">
          <Step n={1} done={!!relayer.data && !low} title="Fund the relayer">
            {relayer.data ? (
              <>
                <span className="font-mono break-all text-fg-strong">{relayer.data.address}</span> holds {Number(relayer.data.balanceEth).toFixed(5)} ETH.
                It signs discount vouchers and pays gas for sponsored (Devcon, sponsored-coupon) claims.
                {low && " Send it about 0.01 ETH on Ethereum."}
              </>
            ) : relayer.isError ? (
              "RELAYER_PRIVATE_KEY isn't set on the server."
            ) : (
              <Spinner />
            )}
          </Step>

          <Step n={2} done={!!registrar} title="Deploy the registrar">
            {registrar ? (
              <div className="space-y-2">
                <p>
                  Deployed at{" "}
                  <a className="link font-mono break-all" href={explorerAddress(registrar)} target="_blank" rel="noreferrer">
                    {registrar}
                  </a>
                </p>
                {!REGISTRAR_ADDRESS && (
                  <Notice tone="warn">
                    Set <span className="font-mono">NEXT_PUBLIC_REGISTRAR_ADDRESS={registrar}</span> in your environment (Vercel → Settings →
                    Environment Variables) and redeploy the site. You can finish the steps below first.
                  </Notice>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p>One transaction. You become its admin and treasury; this app&apos;s relayer becomes its relayer.</p>
                <button type="button" className="btn-primary" onClick={deploy} disabled={!relayer.data || deploying}>
                  {deploying ? <Spinner /> : "Deploy registrar"}
                </button>
                {deployTx && (
                  <a className="link block text-xs" href={explorerTx(MINT_CHAIN.id, deployTx)} target="_blank" rel="noreferrer">
                    Deployment transaction
                  </a>
                )}
              </div>
            )}
          </Step>

          <Step n={3} done={!!s?.approved} title="Approve it in the ENS NameWrapper">
            {s?.approved ? (
              "Approved."
            ) : (
              <div className="space-y-3">
                <p>Lets the registrar create and revoke isworking.eth subnames. Withdraw it any time to pause sales.</p>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!registrar || busy !== null}
                  onClick={() => send("approve", { address: NAME_WRAPPER, abi: NAME_WRAPPER_ABI, functionName: "setApprovalForAll", args: [registrar, true] })}
                >
                  {busy === "approve" ? <Spinner /> : "Approve registrar"}
                </button>
              </div>
            )}
          </Step>

          <Step n={4} done={!!s?.tokens.some((t) => t.on)} title="Accept stablecoins">
            {!s ? (
              "Waiting for the registrar."
            ) : (
              <div className="divide-y divide-border">
                {s.tokens.map((t) => (
                  <Toggle
                    key={t.symbol}
                    checked={t.on}
                    label={t.symbol}
                    desc={`${shortAddress(t.address)} on Ethereum · priced at $1`}
                    onChange={(on) => send(`token-${t.symbol}`, { address: registrar!, functionName: "setToken", args: [t.address, on ? t.decimals : 0] })}
                  />
                ))}
                <p className="pt-2 text-xs">ETH is always accepted (priced with Chainlink ETH/USD).</p>
              </div>
            )}
          </Step>

          <Step n={5} done={relayerOk} title="Check roles">
            {!s ? (
              "Waiting for the registrar."
            ) : (
              <ul className="space-y-1">
                <li>
                  Treasury (receives payments): <span className="font-mono">{shortAddress(s.treasury)}</span>
                </li>
                <li>
                  {relayerOk ? "✓" : "✗"} Relayer matches this app ({shortAddress(s.relayer)})
                  {!relayerOk && relayer.data && (
                    <button
                      type="button"
                      className="btn-ghost ml-2"
                      disabled={busy !== null}
                      onClick={() => send("roles", { address: registrar!, functionName: "setRoles", args: [admin, s.treasury, relayer.data!.address] })}
                    >
                      {busy === "roles" ? <Spinner /> : "Use this app's relayer"}
                    </button>
                  )}
                </li>
              </ul>
            )}
          </Step>
        </ol>
        {error && <div className="mt-2"><Notice tone="bad">{error}</Notice></div>}
        {lastTx && (
          <a className="link mt-2 inline-block text-xs" href={explorerTx(MINT_CHAIN.id, lastTx)} target="_blank" rel="noreferrer">
            Last transaction
          </a>
        )}
      </Section>

      {s?.approved && (
        <Section title="Emergency" desc="Withdrawing approval stops all sales and revokes immediately. Existing names are unaffected. Approve again to resume.">
          <button
            type="button"
            className="btn-secondary text-bad"
            disabled={busy !== null}
            onClick={() => send("pause", { address: NAME_WRAPPER, abi: NAME_WRAPPER_ABI, functionName: "setApprovalForAll", args: [registrar, false] })}
          >
            {busy === "pause" ? <Spinner /> : "Pause sales (withdraw approval)"}
          </button>
        </Section>
      )}
    </div>
  );
}
