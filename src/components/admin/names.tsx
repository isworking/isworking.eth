"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatUnits, keccak256, namehash, parseAbi, toBytes, zeroAddress, type Address } from "viem";
import { normalize } from "viem/ens";
import { usePublicClient } from "wagmi";
import { MINT_CHAIN, PARENT_NAME, explorerTx } from "@/lib/chains";
import { FUSE_PARENT_CANNOT_CONTROL, NAME_WRAPPER, NAME_WRAPPER_ABI } from "@/lib/ens";
import { amount, shortAddress } from "@/lib/format";
import { REGISTRAR_ABI, REGISTRAR_ADDRESS, STABLECOINS } from "@/lib/registrar";
import { Spinner } from "../motion";
import { Notice, Section, fmtDate } from "./ui";
import { useRegistrar, useRegistrarEvents } from "./use-registrar";

const ERC20 = parseAbi(["function approve(address spender, uint256 value)", "function allowance(address, address) view returns (uint256)"]);

export function NamesTab() {
  return (
    <div className="space-y-4">
      <RevokeSection />
      <LocksSection />
      <ReservedSection />
    </div>
  );
}

function cleanLabel(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(/\.isworking\.eth$/, "");
  try {
    return raw && !raw.includes(".") ? normalize(raw) : null;
  } catch {
    return null;
  }
}

function RevokeSection() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const { send, busy, error, setError, lastTx } = useRegistrar();
  const [input, setInput] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [reserve, setReserve] = useState(false);

  const info = useQuery({
    queryKey: ["name-info", label],
    enabled: !!client && !!label,
    queryFn: async () => {
      const node = namehash(`${label}.${PARENT_NAME}`);
      const [data, sale, owed, locked] = await Promise.all([
        client!.readContract({ address: NAME_WRAPPER, abi: NAME_WRAPPER_ABI, functionName: "getData", args: [BigInt(node)] }),
        client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "sales", args: [node] }) as Promise<readonly [Address, bigint, Address, bigint]>,
        client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "refundOwed", args: [node] }) as Promise<bigint>,
        client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "lockedUntil", args: [keccak256(toBytes(label!))] }) as Promise<bigint>,
      ]);
      const [owner, fuses, expiry] = data as readonly [Address, number, bigint];
      return {
        owner,
        locked: (fuses & FUSE_PARENT_CANNOT_CONTROL) !== 0 && Number(expiry) > Date.now() / 1000,
        sale: { buyer: sale[0], soldAt: Number(sale[1]), token: sale[2], paid: sale[3] },
        owed,
        lockedUntil: Number(locked),
        now: Math.floor(Date.now() / 1000),
      };
    },
  });

  async function revoke() {
    const d = info.data;
    if (!d || !label) return;
    const token = STABLECOINS.find((t) => t.address.toLowerCase() === d.sale.token.toLowerCase());
    if (!confirm(`Revoke ${label}.${PARENT_NAME}${d.owed > BigInt(0) ? ` and refund ${refundText(d.owed, token)}` : ""}? It stops resolving immediately.`)) return;
    setError(null);
    if (token && d.owed > BigInt(0)) {
      // Token refunds are pulled from your wallet, so allow the registrar to take them first.
      const allowance = (await client!.readContract({ address: token.address, abi: ERC20, functionName: "allowance", args: [(await client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "admin" })) as Address, REGISTRAR_ADDRESS!] })) as bigint;
      if (allowance < d.owed) {
        const ok = await send("approve", { address: token.address, abi: ERC20, functionName: "approve", args: [REGISTRAR_ADDRESS, d.owed] });
        if (!ok) return;
      }
    }
    // ETH refunds ride along as msg.value (+1% for time passing; the excess comes back).
    const value = !token && d.owed > BigInt(0) ? (d.owed * BigInt(101)) / BigInt(100) : undefined;
    await send("revoke", { functionName: "revoke", args: [label, reserve], value });
  }

  return (
    <Section
      title="Revoke a name"
      desc="Takes a name back on-chain and refunds whoever paid the name fee (not gas), shrinking to zero over the refund period, all in one transaction from your wallet. Revoked names are locked from re-claiming for the lock period."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLabel(cleanLabel(input));
        }}
        className="flex gap-2"
      >
        <div className="flex flex-1 items-center rounded-xl border border-border bg-card-solid pr-3 focus-within:border-accent">
          <input className="h-11 min-w-0 flex-1 bg-transparent px-3.5 font-mono text-fg-strong outline-none" placeholder="name" value={input} onChange={(e) => setInput(e.target.value)} />
          <span className="font-mono text-sm text-muted">.{PARENT_NAME}</span>
        </div>
        <button type="submit" className="btn-secondary">
          Look up
        </button>
      </form>

      {label && (
        <div className="mt-4 rounded-xl bg-bg-soft p-4 text-sm">
          <p className="font-mono text-fg-strong">
            {label}.{PARENT_NAME}
          </p>
          {info.isLoading ? (
            <Spinner />
          ) : !info.data ? null : info.data.owner === zeroAddress ? (
            <p className="mt-1 text-muted">
              Not registered.{info.data.lockedUntil > info.data.now && ` Locked until ${fmtDate(info.data.lockedUntil)}.`}
            </p>
          ) : info.data.locked ? (
            <div className="mt-3">
              <Notice tone="warn">Owned by {shortAddress(info.data.owner)}, minted elsewhere with &quot;parent cannot control&quot; burned: it can&apos;t be revoked until it expires.</Notice>
            </div>
          ) : (
            <>
              <p className="mt-1 text-muted">
                Owner <span className="font-mono">{shortAddress(info.data.owner)}</span>
                {info.data.sale.soldAt > 0 && (
                  <>
                    {" "}
                    · sold {fmtDate(info.data.sale.soldAt)} to <span className="font-mono">{shortAddress(info.data.sale.buyer)}</span>
                  </>
                )}
              </p>
              <p className="mt-1 text-muted">
                Refund if revoked now:{" "}
                <span className="text-fg-strong">
                  {refundText(info.data.owed, STABLECOINS.find((t) => t.address.toLowerCase() === info.data!.sale.token.toLowerCase()))}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button type="button" className="btn-primary bg-bad hover:bg-bad/85" onClick={revoke} disabled={busy !== null}>
                  {busy === "revoke" || busy === "approve" ? <Spinner /> : "Revoke & refund"}
                </button>
                <label className="flex items-center gap-2 text-muted">
                  <input type="checkbox" checked={reserve} onChange={(e) => setReserve(e.target.checked)} className="accent-[var(--accent)]" />
                  Reserve it permanently instead of locking it
                </label>
              </div>
            </>
          )}
        </div>
      )}
      {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}
      {lastTx && (
        <a className="link mt-3 inline-block text-xs" href={explorerTx(MINT_CHAIN.id, lastTx)} target="_blank" rel="noreferrer">
          Last transaction
        </a>
      )}
    </Section>
  );
}

function refundText(owed: bigint, token?: { symbol: string; decimals: number }) {
  if (owed === BigInt(0)) return "nothing";
  return token ? `${amount(formatUnits(owed, token.decimals))} ${token.symbol}` : `${amount(Number(formatUnits(owed, 18)).toFixed(6))} ETH`;
}

/** Labels touched by an event type, de-duplicated, newest first. */
function useLabelsFrom(names: string[]) {
  const events = useRegistrarEvents();
  return useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of [...(events.data ?? [])].reverse()) {
      if (!names.includes(e.eventName)) continue;
      const l = (e.args as { label: string }).label;
      if (seen.has(l)) continue;
      seen.add(l);
      out.push(l);
    }
    return out;
  }, [events.data, names]);
}

function LocksSection() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const { send, busy } = useRegistrar();
  const labels = useLabelsFrom(useMemo(() => ["Revoked", "LockSet"], []));
  const locks = useQuery({
    queryKey: ["locks", labels.join()],
    enabled: !!client && labels.length > 0,
    queryFn: async () =>
      (
        await Promise.all(
          labels.map(async (l) => ({
            label: l,
            until: Number(await client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "lockedUntil", args: [keccak256(toBytes(l))] })),
          })),
        )
      ).filter((l) => l.until > Date.now() / 1000),
  });

  return (
    <Section title="Revocation locks" desc="Revoked names can't be claimed again until their lock ends. Change the length in Settings (0 turns it off).">
      {!locks.data?.length ? (
        <p className="text-sm text-muted">No names are locked.</p>
      ) : (
        <div className="divide-y divide-border">
          {locks.data.map((l) => (
            <div key={l.label} className="flex items-center gap-4 py-2.5 text-sm">
              <span className="font-mono text-fg-strong">
                {l.label}.{PARENT_NAME}
              </span>
              <span className="ml-auto text-muted">until {fmtDate(l.until)}</span>
              <button type="button" className="btn-ghost" disabled={busy !== null} onClick={() => confirm(`Lift the lock on ${l.label}? Anyone can claim it right away.`) && send(`lift-${l.label}`, { functionName: "setLock", args: [l.label, BigInt(0)] })}>
                {busy === `lift-${l.label}` ? <Spinner /> : "Lift lock"}
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ReservedSection() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const { send, busy, error } = useRegistrar();
  const labels = useLabelsFrom(useMemo(() => ["ReservedSet"], []));
  const [input, setInput] = useState("");
  const reserved = useQuery({
    queryKey: ["reserved", labels.join()],
    enabled: !!client && labels.length > 0,
    queryFn: async () => {
      const flags = await Promise.all(
        labels.map((l) => client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "reserved", args: [keccak256(toBytes(l))] }) as Promise<boolean>),
      );
      return labels.filter((_, i) => flags[i]).sort();
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const list = input.split(/[\s,]+/).map(cleanLabel).filter((l): l is string => !!l);
    if (!list.length) return;
    if (await send("reserve", { functionName: "setReserved", args: [list, true] })) setInput("");
  }

  return (
    <Section title="Reserved names" desc="Names nobody can claim. Separate several with commas or spaces; one transaction for all of them.">
      <form onSubmit={add} className="flex gap-2">
        <input className="input font-mono" placeholder="vitalik, ens, support" value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" className="btn-primary" disabled={busy !== null}>
          {busy === "reserve" ? <Spinner /> : "Reserve"}
        </button>
      </form>
      {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}
      <div className="mt-4 flex flex-wrap gap-2">
        {(reserved.data ?? []).map((l) => (
          <span key={l} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card-solid py-1 pr-1 pl-2.5 font-mono text-sm text-fg-strong">
            {l}
            <button type="button" onClick={() => send(`unreserve-${l}`, { functionName: "setReserved", args: [[l], false] })} className="grid size-5 place-items-center rounded text-faint hover:bg-bad-soft hover:text-bad" aria-label={`Unreserve ${l}`}>
              ×
            </button>
          </span>
        ))}
        {!reserved.data?.length && <p className="text-sm text-muted">No reserved names.</p>}
      </div>
    </Section>
  );
}
