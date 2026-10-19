"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits, keccak256, toBytes, type Address } from "viem";
import { usePublicClient } from "wagmi";
import { MINT_CHAIN } from "@/lib/chains";
import { NAME_WRAPPER, NAME_WRAPPER_ABI } from "@/lib/ens";
import { amount, api, shortAddress } from "@/lib/format";
import { REGISTRAR_ABI, REGISTRAR_ADDRESS, STABLECOINS } from "@/lib/registrar";
import { Spinner } from "../motion";
import { Notice, Section, fmtDate } from "./ui";
import { useRegistrarEvents } from "./use-registrar";

const BASE_REGISTRAR = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const;
const BASE_ABI = [
  { type: "function", name: "nameExpires", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

export function OverviewTab() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const events = useRegistrarEvents();
  const relayer = useQuery({ queryKey: ["relayer"], queryFn: () => api<{ address: Address; balanceEth: string }>("/api/relayer") });
  const chain = useQuery({
    queryKey: ["overview-chain"],
    enabled: !!client,
    queryFn: async () => {
      const r = (fn: string, args: unknown[] = []) => client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: fn, args } as never);
      const admin = (await r("admin")) as Address;
      const [approved, expires, priceOk] = await Promise.all([
        client!.readContract({ address: NAME_WRAPPER, abi: NAME_WRAPPER_ABI, functionName: "isApprovedForAll", args: [admin, REGISTRAR_ADDRESS!] }),
        client!.readContract({ address: BASE_REGISTRAR, abi: BASE_ABI, functionName: "nameExpires", args: [BigInt(keccak256(toBytes("isworking")))] }),
        (r("quoteWei", [BigInt(99)]) as Promise<bigint>).then(() => true).catch(() => false),
      ]);
      return { approved, expires: Number(expires), priceOk, now: Math.floor(Date.now() / 1000) };
    },
  });

  if (events.isLoading || chain.isLoading) return <Spinner className="size-5" />;
  const ev = events.data ?? [];
  const sold = ev.filter((e) => e.eventName === "Registered");
  const revoked = ev.filter((e) => e.eventName === "Revoked").length;
  const revenue = new Map<string, bigint>();
  for (const e of sold) {
    const a = e.args as { token: Address; paid: bigint };
    const sym = a.token === "0x0000000000000000000000000000000000000000" ? "ETH" : (STABLECOINS.find((t) => t.address.toLowerCase() === a.token.toLowerCase())?.symbol ?? "?");
    revenue.set(sym, (revenue.get(sym) ?? BigInt(0)) + a.paid);
  }
  const fmt = (sym: string, v: bigint) => `${amount(formatUnits(v, sym === "ETH" || sym === "DAI" ? 18 : 6))} ${sym}`;
  const daysLeft = chain.data ? Math.floor((chain.data.expires - chain.data.now) / 86400) : null;
  const low = relayer.data && Number(relayer.data.balanceEth) < 0.003;

  return (
    <div className="space-y-4">
      {daysLeft !== null && daysLeft < 365 && (
        <Notice tone={daysLeft < 90 ? "bad" : "warn"}>
          <b>isworking.eth expires {fmtDate(chain.data!.expires)}</b> ({daysLeft} days). Renew it at app.ens.domains: if it lapses the registrar
          stops working, and after ENS&apos;s 90-day grace period every isworking.eth name stops resolving.
        </Notice>
      )}
      {chain.data && !chain.data.approved && <Notice tone="bad">The registrar isn&apos;t approved in the NameWrapper: sales are paused. See Setup.</Notice>}
      {chain.data && !chain.data.priceOk && <Notice tone="warn">The Chainlink ETH/USD feed looks stale; ETH payments are paused until it updates (stablecoins still work).</Notice>}
      {low && <Notice tone="warn">The relayer is low on ETH ({Number(relayer.data!.balanceEth).toFixed(4)}). Sponsored claims will fail until you top it up.</Notice>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Names sold" value={String(sold.length)} sub={revoked ? `${revoked} revoked` : undefined} />
        <Stat label="Sponsored" value={String(sold.filter((e) => (e.args as { sponsored: boolean }).sponsored).length)} />
        <Stat label="Revenue" value={revenue.size ? [...revenue].map(([s, v]) => fmt(s, v)).join(" · ") : "—"} small />
      </div>

      <Section title="Contracts">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="label">Registrar</dt>
            <dd className="font-mono break-all text-fg-strong">{REGISTRAR_ADDRESS}</dd>
          </div>
          <div>
            <dt className="label">Relayer</dt>
            <dd className="font-mono text-fg-strong">{relayer.data ? `${shortAddress(relayer.data.address)} · ${Number(relayer.data.balanceEth).toFixed(5)} ETH` : "—"}</dd>
          </div>
        </dl>
      </Section>
    </div>
  );
}

function Stat({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className={`${small ? "text-base" : "text-2xl"} font-semibold text-fg-strong tabular-nums`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
