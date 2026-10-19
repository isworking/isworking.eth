"use client";

import type { ReactNode } from "react";

export function Section({ title, desc, children, action }: { title: string; desc?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-fg-strong">{title}</h2>
          {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Notice({ tone, children }: { tone: "bad" | "warn" | "ok"; children: ReactNode }) {
  const cls = { bad: "bg-bad-soft text-bad", warn: "bg-warn-soft text-warn", ok: "bg-ok-soft text-ok" }[tone];
  return <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${cls}`}>{children}</div>;
}

const STATUS: Record<string, string> = {
  quoted: "bg-bg-soft text-muted",
  paying: "bg-accent-soft text-accent",
  paid: "bg-accent-soft text-accent",
  minting: "bg-accent-soft text-accent",
  minted: "bg-ok-soft text-ok",
  failed: "bg-bad-soft text-bad",
  failed_refunded: "bg-bg-soft text-muted",
  revoked: "bg-warn-soft text-warn",
  expired: "bg-bg-soft text-faint",
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill ${STATUS[status] ?? "bg-bg-soft text-muted"}`}>{status.replace("_", " ")}</span>;
}

export const fmtDate = (s: number | null | undefined) =>
  s ? new Date(s * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="text-sm text-fg-strong">{label}</span>
        {desc && <span className="block text-xs text-muted">{desc}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-border-strong"}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-card-solid shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}
