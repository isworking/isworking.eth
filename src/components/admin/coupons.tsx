"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Hex } from "viem";
import { usePublicClient } from "wagmi";
import { MINT_CHAIN } from "@/lib/chains";
import { REGISTRAR_ABI, REGISTRAR_ADDRESS, ZERO32, couponHash, devconCode, normalizeCode } from "@/lib/registrar";
import { Spinner } from "../motion";
import { Notice, Section, Toggle, fmtDate } from "./ui";
import { useRegistrar, useRegistrarEvents } from "./use-registrar";

type CouponSet = { codeHash: Hex; percentOff: number; sponsored: boolean; active: boolean; maxUses: number; expiresAt: bigint; note: string };

// Codes never go on-chain (only their hash), so this browser remembers the ones you made.
const CODES_KEY = "coupon-codes";
function savedCodes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CODES_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCode(hash: Hex, code: string) {
  try {
    localStorage.setItem(CODES_KEY, JSON.stringify({ ...savedCodes(), [hash]: code }));
  } catch {}
}

const randomCode = () => {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => a[b % a.length]).join("");
};

/** codeHash → a human label (the code if this browser made it, else its public note). */
export function useCouponNotes() {
  const events = useRegistrarEvents();
  return useMemo(() => {
    const m = new Map<string, string>();
    const local = typeof window === "undefined" ? {} : savedCodes();
    for (const e of events.data ?? []) {
      if (e.eventName !== "CouponSet") continue;
      const a = e.args as unknown as CouponSet;
      m.set(a.codeHash, local[a.codeHash] ?? (a.note || `${a.codeHash.slice(0, 10)}…`));
    }
    return m;
  }, [events.data]);
}

export function CouponsTab() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const events = useRegistrarEvents();
  const { send, busy, error } = useRegistrar();
  const [form, setForm] = useState({ code: "", percentOff: "50", maxUses: "", expiresAt: "", note: "", sponsored: false });
  const [created, setCreated] = useState<string | null>(null);
  const [nowSec] = useState(() => Date.now() / 1000);
  const local = useMemo(() => (typeof window === "undefined" ? {} : savedCodes()), [events.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Latest settings per coupon, from the CouponSet events.
  const list = useMemo(() => {
    const m = new Map<string, CouponSet>();
    for (const e of events.data ?? []) if (e.eventName === "CouponSet") m.set((e.args as unknown as CouponSet).codeHash, e.args as unknown as CouponSet);
    return [...m.values()].reverse();
  }, [events.data]);

  const uses = useQuery({
    queryKey: ["coupon-uses", list.map((c) => c.codeHash).join()],
    enabled: !!client && list.length > 0,
    queryFn: async () =>
      Object.fromEntries(
        await Promise.all(
          list.map(async (c) => {
            const r = (await client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "coupons", args: [c.codeHash] })) as readonly unknown[];
            return [c.codeHash, Number(r[4])] as const;
          }),
        ),
      ),
  });

  const devconClaims = (events.data ?? []).filter((e) => e.eventName === "Registered" && (e.args as { ticket: Hex }).ticket !== ZERO32);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const code = normalizeCode(form.code || randomCode());
    if (!/^[A-Z0-9_-]{3,64}$/.test(code)) return;
    const hash = couponHash(code);
    const ok = await send("create", {
      functionName: "setCoupon",
      args: [
        hash,
        form.sponsored ? 100 : Number(form.percentOff),
        form.sponsored,
        true,
        form.maxUses ? Number(form.maxUses) : 0,
        form.expiresAt ? BigInt(Math.floor(new Date(form.expiresAt).getTime() / 1000)) : BigInt(0),
        form.note.trim(),
      ],
    });
    if (ok) {
      saveCode(hash, code);
      setCreated(code);
      setForm({ ...form, code: "", note: "", maxUses: "", expiresAt: "" });
    }
  }

  const weak = form.code && normalizeCode(form.code).length < 8;

  return (
    <div className="space-y-4">
      <Section title="New coupon" desc="Regular coupons take % off the name; buyers still pay gas, even at 100%. Sponsored coupons are free and cover the gas too.">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="c-code">Code</label>
            <div className="flex gap-2">
              <input id="c-code" className="input font-mono uppercase" placeholder="random" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              <button type="button" className="btn-secondary h-11 px-3" onClick={() => setForm({ ...form, code: randomCode() })} title="Generate">
                ↻
              </button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-pct">% off</label>
            <input id="c-pct" className="input disabled:opacity-60" type="number" min={1} max={100} required disabled={form.sponsored} value={form.sponsored ? "100" : form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="c-max">Max uses</label>
            <input id="c-max" className="input" type="number" min={1} placeholder="∞" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="c-exp">Expires</label>
            <input id="c-exp" className="input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <div className="sm:col-span-6">
            <Toggle
              checked={form.sponsored}
              onChange={(v) => setForm({ ...form, sponsored: v })}
              label="Sponsor"
              desc="100% off and the gas is covered: the buyer just signs a message and the relayer pays (a few cents per use). Set max uses."
            />
          </div>
          <div className="sm:col-span-5">
            <label className="label" htmlFor="c-note">Public note (shown on-chain, never the code)</label>
            <input id="c-note" className="input" placeholder="e.g. OSS sponsorship" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full" disabled={busy !== null}>
              {busy === "create" ? <Spinner /> : "Create"}
            </button>
          </div>
        </form>
        {weak && <p className="mt-2 text-xs text-warn">Short codes can be guessed: only the code&apos;s hash is on-chain, but anyone can try candidates against it.</p>}
        {created && (
          <div className="mt-3">
            <Notice tone="ok">
              Created <span className="font-mono">{created}</span>. Copy it now: only its hash is on-chain (this browser remembers it too).
            </Notice>
          </div>
        )}
        {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}
      </Section>

      <Section title="Coupons" desc="From the registrar's events. Codes are shown only in the browser that created them.">
        {events.isLoading ? (
          <Spinner />
        ) : !list.length ? (
          <p className="text-sm text-muted">No coupons yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {list.map((c) => {
              const expired = Number(c.expiresAt) !== 0 && Number(c.expiresAt) < nowSec;
              const used = uses.data?.[c.codeHash];
              return (
                <div key={c.codeHash} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
                  <div className="min-w-44">
                    <p className="font-mono text-fg-strong">{local[c.codeHash] ?? `${c.codeHash.slice(0, 12)}…`}</p>
                    {c.note && <p className="text-xs text-muted">{c.note}</p>}
                  </div>
                  <p className="w-24 text-sm font-medium text-fg-strong">
                    {c.sponsored ? <span className="pill bg-accent-soft text-accent">Sponsored</span> : `${c.percentOff}%`}
                  </p>
                  <p className="w-24 text-sm text-muted tabular-nums">
                    {used ?? "…"}/{c.maxUses || "∞"} used
                  </p>
                  <p className={`text-sm ${expired ? "text-bad" : "text-muted"}`}>
                    {Number(c.expiresAt) ? `${expired ? "Expired" : "Expires"} ${fmtDate(Number(c.expiresAt))}` : "No expiry"}
                  </p>
                  <div className="ml-auto w-28">
                    <Toggle
                      checked={c.active}
                      label={c.active ? "Active" : "Off"}
                      onChange={(v) => send(`toggle-${c.codeHash}`, { functionName: "setCoupon", args: [c.codeHash, c.percentOff, c.sponsored, v, c.maxUses, c.expiresAt, c.note] })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Devcon 8 codes" desc="Each verified ticket is its own single-use, sponsored DEVCON8_ coupon, valid until Devcon ends.">
        {!devconClaims.length ? (
          <p className="text-sm text-muted">No Devcon claims yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {devconClaims.map((e) => (
              <span key={e.transactionHash} className="rounded-lg border border-border bg-card-solid px-2.5 py-1 font-mono text-xs text-fg-strong" title={(e.args as { label: string }).label}>
                {devconCode((e.args as { ticket: Hex }).ticket)} → {(e.args as { label: string }).label}
              </span>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
