"use client";

import { useState } from "react";
import { formatUnits, type Address, type Hex } from "viem";
import { MINT_CHAIN, explorerTx } from "@/lib/chains";
import { amount, shortAddress } from "@/lib/format";
import { STABLECOINS, ZERO32, devconCode } from "@/lib/registrar";
import { Spinner } from "../motion";
import { Section, fmtDate } from "./ui";
import { useRegistrarEvents } from "./use-registrar";
import { useCouponNotes } from "./coupons";

type Registered = {
  label: string;
  owner: Address;
  token: Address;
  paid: bigint;
  percentOff: number;
  codeHash: Hex;
  ticket: Hex;
  sponsored: boolean;
};

/** Every sale, straight from the registrar's Registered events. */
export function SalesTab() {
  const events = useRegistrarEvents();
  const notes = useCouponNotes();
  const [filter, setFilter] = useState("");
  if (events.isLoading) return <Spinner />;

  const sales = (events.data ?? [])
    .filter((e) => e.eventName === "Registered")
    .map((e) => ({ e, a: e.args as unknown as Registered }))
    .filter(({ a }) => !filter || a.label.includes(filter.toLowerCase()) || a.owner.toLowerCase().includes(filter.toLowerCase()))
    .reverse();

  const paid = (a: Registered) => {
    if (a.paid === BigInt(0)) return a.sponsored ? "sponsored" : "free (gas only)";
    const t = STABLECOINS.find((s) => s.address.toLowerCase() === a.token.toLowerCase());
    return t ? `${amount(formatUnits(a.paid, t.decimals))} ${t.symbol}` : `${amount(Number(formatUnits(a.paid, 18)).toFixed(6))} ETH`;
  };
  const discount = (a: Registered) => {
    if (a.ticket !== ZERO32) return `Devcon · ${devconCode(a.ticket)}`;
    if (a.codeHash !== ZERO32) return `${a.percentOff}% · ${notes.get(a.codeHash) ?? "coupon"}`;
    return "—";
  };

  return (
    <Section
      title="Sales"
      desc="Read from the registrar's on-chain events, newest first."
      action={<input className="input h-9 w-48" placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} />}
    >
      {!sales.length ? (
        <p className="text-sm text-muted">No sales yet.</p>
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-muted uppercase">
              <tr className="border-b border-border">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Owner</th>
                <th className="py-2 font-medium">Paid</th>
                <th className="py-2 font-medium">Discount</th>
                <th className="py-2 font-medium">When</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {sales.map(({ e, a }) => (
                <tr key={`${e.transactionHash}-${e.logIndex}`} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 font-mono text-fg-strong">{a.label}.isworking.eth</td>
                  <td className="py-3 font-mono">{shortAddress(a.owner)}</td>
                  <td className="py-3">{paid(a)}</td>
                  <td className="py-3 text-muted">{discount(a)}</td>
                  <td className="py-3 text-xs text-muted">{e.timestamp ? fmtDate(e.timestamp) : `block ${e.blockNumber}`}</td>
                  <td className="px-5 py-3 text-right">
                    <a className="link text-xs" href={explorerTx(MINT_CHAIN.id, e.transactionHash)} target="_blank" rel="noreferrer">
                      tx
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
