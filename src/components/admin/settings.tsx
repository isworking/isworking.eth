"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { Spinner } from "../motion";
import { Notice, Section } from "./ui";
import { useOnchainConfig, type OnchainConfig } from "./use-config";
import { useRegistrar } from "./use-registrar";

export function SettingsTab() {
  const config = useOnchainConfig();
  if (!config.data) return <Spinner />;
  return <SettingsForm key={JSON.stringify(config.data)} c={config.data} />;
}

function SettingsForm({ c }: { c: OnchainConfig }) {
  const { send, busy, error } = useRegistrar();
  const [price, setPrice] = useState((c.priceCents / 100).toFixed(2));
  const [refundDays, setRefundDays] = useState(String(Math.round(c.refundPeriod / 86400)));
  const [lockDays, setLockDays] = useState(String(Math.round(c.lockPeriod / 86400)));
  const [minLen, setMinLen] = useState(String(c.policy.minLabelLength));
  const [roles, setRoles] = useState({ admin: c.admin, treasury: c.treasury, relayer: c.relayer });

  return (
    <div className="space-y-4">
      <Section title="Pricing" desc="Stored in the registrar; saving sends one transaction from your wallet.">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            send("pricing", {
              functionName: "setPricing",
              args: [Math.round(Number(price) * 100), Math.round(Number(refundDays) * 86400), Math.round(Number(lockDays) * 86400)],
            });
          }}
        >
          <div>
            <label className="label" htmlFor="s-price">Price (USD, one-time, excl. gas)</label>
            <input id="s-price" className="input" type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="s-refund">Refund period (days)</label>
            <input id="s-refund" className="input" type="number" min={0} value={refundDays} onChange={(e) => setRefundDays(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="s-lock">Revocation lock (days, 0 = off)</label>
            <input id="s-lock" className="input" type="number" min={0} value={lockDays} onChange={(e) => setLockDays(e.target.value)} />
          </div>
          <p className="text-xs text-muted sm:col-span-2">
            Names are permanent. Revoked names refund the name fee, shrinking linearly to zero over the refund period after the sale.
          </p>
          <button type="submit" className="btn-primary" disabled={busy !== null}>
            {busy === "pricing" ? <Spinner /> : "Save pricing"}
          </button>
        </form>
      </Section>

      <Section title="Names" desc="Rules the contract can't check itself, kept in its on-chain policy.">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            send("policy", { functionName: "setPolicy", args: [JSON.stringify({ ...c.policy, minLabelLength: Math.max(1, Number(minLen)) })] });
          }}
        >
          <div>
            <label className="label" htmlFor="s-min">Minimum name length</label>
            <input id="s-min" className="input w-40" type="number" min={1} max={32} value={minLen} onChange={(e) => setMinLen(e.target.value)} />
          </div>
          <button type="submit" className="btn-secondary" disabled={busy !== null}>
            {busy === "policy" ? <Spinner /> : "Save"}
          </button>
        </form>
      </Section>

      <Section title="Roles" desc="Careful: a wrong admin address locks you out of the registrar for good.">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!Object.values(roles).every((a) => isAddress(a))) return;
            if (roles.admin.toLowerCase() !== c.admin.toLowerCase() && !confirm(`Hand admin rights to ${roles.admin}? You'll lose access from this wallet.`)) return;
            send("roles", { functionName: "setRoles", args: [roles.admin, roles.treasury, roles.relayer] });
          }}
        >
          {(["admin", "treasury", "relayer"] as const).map((k) => (
            <div key={k}>
              <label className="label" htmlFor={`r-${k}`}>
                {k === "admin" ? "Admin (configures & revokes)" : k === "treasury" ? "Treasury (receives every payment)" : "Relayer (signs vouchers, sends sponsored claims)"}
              </label>
              <input id={`r-${k}`} className="input font-mono text-sm" value={roles[k]} onChange={(e) => setRoles({ ...roles, [k]: e.target.value as `0x${string}` })} />
            </div>
          ))}
          <button type="submit" className="btn-secondary w-fit" disabled={busy !== null}>
            {busy === "roles" ? <Spinner /> : "Save roles"}
          </button>
        </form>
      </Section>
      {error && <Notice tone="bad">{error}</Notice>}
    </div>
  );
}
