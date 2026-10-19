"use client";

import { useState } from "react";
import type { SignerIdentity } from "@/lib/devcon/pkpass";
import type { Policy } from "@/lib/registrar";
import { Spinner } from "../motion";
import { Notice, Section, Toggle, fmtDate } from "./ui";
import { useOnchainConfig, type OnchainConfig } from "./use-config";
import { useRegistrar } from "./use-registrar";

export function DevconTab() {
  const config = useOnchainConfig();
  if (!config.data) return <Spinner />;
  return <DevconForm key={JSON.stringify(config.data)} c={config.data} />;
}

const toLocal = (s: number) => (s ? new Date(s * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function DevconForm({ c }: { c: OnchainConfig }) {
  const { send, busy, error, setError } = useRegistrar();
  const [pct, setPct] = useState(String(c.devconPercentOff));
  const [sponsored, setSponsored] = useState(c.devconSponsored);
  const [endsAt, setEndsAt] = useState(toLocal(c.devconEndsAt));
  const [policy, setPolicy] = useState<Policy["devcon"]>(c.policy.devcon);
  const [inspected, setInspected] = useState<(SignerIdentity & { devcon8: boolean; description: string }) | null>(null);
  const [gLink, setGLink] = useState("");
  const [gInspected, setGInspected] = useState<{ iss: string; issuerIds: string[]; devcon8: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  const policyDirty = JSON.stringify(policy) !== JSON.stringify(c.policy.devcon);
  const savePolicy = (devcon: Policy["devcon"]) => send("policy", { functionName: "setPolicy", args: [JSON.stringify({ ...c.policy, devcon })] });
  const pinned = policy.passTypeIds.length > 0 || policy.teamIds.length > 0;

  async function inspect(file: File | undefined) {
    if (!file) return;
    setChecking(true);
    setError(null);
    setInspected(null);
    try {
      const { openPkpass, passText, looksLikeDevcon8 } = await import("@/lib/devcon/pkpass");
      const { identity, pass } = await openPkpass(new Uint8Array(await file.arrayBuffer()));
      setInspected({ ...identity, devcon8: looksLikeDevcon8(passText(pass)), description: String(pass.description ?? pass.organizationName ?? "") });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that pass");
    } finally {
      setChecking(false);
    }
  }

  async function inspectGoogle() {
    setError(null);
    setGInspected(null);
    try {
      const { extractSaveJwt, decodeJwt, verifySaveJwt } = await import("@/lib/devcon/gwallet");
      const { looksLikeDevcon8 } = await import("@/lib/devcon/pkpass");
      const jwt = extractSaveJwt(gLink);
      if (!jwt) throw new Error("That isn't a Google Wallet save link");
      const iss = String(decodeJwt(jwt).claims.iss);
      const res = await fetch(`/api/devcon/google-keys?iss=${encodeURIComponent(iss)}`);
      if (!res.ok) throw new Error("Couldn't fetch the issuer's keys from Google");
      const pass = await verifySaveJwt(jwt, (await res.json()).keys);
      setGInspected({ iss: pass.iss, issuerIds: pass.issuerIds, devcon8: looksLikeDevcon8(pass.text) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that link");
    }
  }

  return (
    <div className="space-y-4">
      {!pinned && policy.acceptPkpass && (
        <Notice tone="warn">
          The Apple Wallet issuer isn&apos;t pinned yet, so passes are matched by issuer name only. Drop your own Devcon 8 pass below and pin
          its issuer.
        </Notice>
      )}

      <Section title="Devcon 8 discount" desc="Each verified ticket is its own single-use DEVCON8_ coupon; the contract enforces one claim per ticket and per wallet.">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            send("devcon", {
              functionName: "setDevcon",
              args: [Number(pct), sponsored, BigInt(endsAt ? Math.floor(new Date(endsAt).getTime() / 1000) : 0)],
            });
          }}
        >
          <div>
            <label className="label" htmlFor="d-pct">% off the name</label>
            <input id="d-pct" className="input" type="number" min={0} max={100} value={pct} onChange={(e) => setPct(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="d-end">Ends (the ticket check disappears; DEVCON8_ codes expire)</label>
            <input id="d-end" className="input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Toggle checked={sponsored} onChange={setSponsored} label="Sponsored (gas covered)" desc="At 100% off, the relayer pays the gas and the attendee just signs a message" />
          </div>
          <p className="text-xs text-muted sm:col-span-2">Currently ends {fmtDate(c.devconEndsAt)}.</p>
          <button type="submit" className="btn-primary" disabled={busy !== null}>
            {busy === "devcon" ? <Spinner /> : "Save"}
          </button>
        </form>
      </Section>

      <Section title="Ticket checks" desc="Kept in the registrar's on-chain policy and enforced by the voucher server.">
        <div className="divide-y divide-border">
          <Toggle checked={policy.acceptPkpass} onChange={(v) => setPolicy({ ...policy, acceptPkpass: v })} label="Accept Apple Wallet passes" desc="Apple's signature is verified in the browser and again on the server" />
          <Toggle checked={policy.acceptGoogle} onChange={(v) => setPolicy({ ...policy, acceptGoogle: v })} label="Accept Google Wallet links" desc="Google-signed save links, verified against the issuer's published keys" />
          <Toggle
            checked={policy.googleServerVerify}
            onChange={(v) => setPolicy({ ...policy, googleServerVerify: v })}
            label="Re-check Google Wallet links on the server"
            desc="Recommended. The browser sends the link for checking (it's never stored)."
          />
        </div>
        {policyDirty && (
          <button type="button" className="btn-primary mt-3" disabled={busy !== null} onClick={() => savePolicy(policy)}>
            {busy === "policy" ? <Spinner /> : "Save ticket checks"}
          </button>
        )}
      </Section>

      <Section title="Pinned Google Wallet issuer" desc="Only links signed by these issuers are accepted. Until pinned, the link must name Devcon 8.">
        {policy.googleIssuers.length ? (
          <ul className="space-y-1 font-mono text-xs">{policy.googleIssuers.map((i) => <li key={i}>{i}</li>)}</ul>
        ) : (
          <p className="text-sm text-muted">Nothing pinned.</p>
        )}
        <div className="mt-3 flex gap-2">
          <input className="input h-10 font-mono text-xs" placeholder="Paste your own Devcon 8 “Add to Google Wallet” link" value={gLink} onChange={(e) => setGLink(e.target.value)} />
          <button type="button" className="btn-secondary h-10 shrink-0 px-4 text-sm" onClick={inspectGoogle} disabled={!gLink.trim()}>
            Inspect
          </button>
        </div>
        {gInspected && (
          <div className="mt-3 rounded-xl bg-bg-soft p-4 text-sm">
            <div className="font-mono text-xs">Signed by: {gInspected.iss}</div>
            <div className="font-mono text-xs">Issuer IDs: {gInspected.issuerIds.join(", ") || "—"}</div>
            <p className={`mt-2 text-xs ${gInspected.devcon8 ? "text-ok" : "text-warn"}`}>
              {gInspected.devcon8 ? "Mentions Devcon 8." : "The link doesn't spell out Devcon 8 (normal for short links). Make sure it's your Devcon ticket."}
            </p>
            <button
              type="button"
              className="btn-primary mt-3"
              disabled={busy !== null}
              onClick={() => savePolicy({ ...policy, googleIssuers: [...new Set([...policy.googleIssuers, gInspected.iss, ...gInspected.issuerIds])] })}
            >
              Pin this issuer
            </button>
          </div>
        )}
        {policy.googleIssuers.length > 0 && (
          <button type="button" className="btn-ghost mt-3 text-bad" onClick={() => savePolicy({ ...policy, googleIssuers: [] })}>
            Clear pinned issuer
          </button>
        )}
      </Section>

      <Section title="Pinned Apple Wallet issuer" desc="Only passes signed by these Apple Pass Type IDs / Team IDs are accepted.">
        {pinned ? (
          <ul className="space-y-1 font-mono text-xs">
            {policy.passTypeIds.map((p) => <li key={p}>Pass Type ID: {p}</li>)}
            {policy.teamIds.map((t) => <li key={t}>Team ID: {t}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing pinned.</p>
        )}
        <p className="mt-2 text-xs text-muted">Passes signed before {fmtDate(policy.minSigningTime)} are rejected as older Devcons.</p>
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-5 text-sm text-muted hover:border-accent hover:text-fg-strong">
          <input type="file" accept=".pkpass" className="hidden" onChange={(e) => inspect(e.target.files?.[0])} />
          {checking ? <Spinner /> : "Drop or choose a Devcon 8 .pkpass to inspect (stays in your browser)"}
        </label>
        {inspected && (
          <div className="mt-3 rounded-xl bg-bg-soft p-4 text-sm">
            <dl className="grid gap-1 font-mono text-xs">
              <div>Pass Type ID: {inspected.passTypeIdentifier}</div>
              <div>Team ID: {inspected.teamIdentifier}</div>
              <div>Organisation: {inspected.organization}</div>
              <div>Signed: {fmtDate(inspected.signingTime)}</div>
              <div>Pass: {inspected.description}</div>
            </dl>
            <p className={`mt-2 text-xs ${inspected.devcon8 ? "text-ok" : "text-warn"}`}>
              {inspected.devcon8 ? "Looks like a Devcon 8 ticket." : "This doesn't look like a Devcon 8 ticket. Double-check before pinning."}
            </p>
            <button
              type="button"
              className="btn-primary mt-3"
              disabled={busy !== null}
              onClick={() =>
                savePolicy({
                  ...policy,
                  passTypeIds: [...new Set([...policy.passTypeIds, inspected.passTypeIdentifier])],
                  teamIds: [...new Set([...policy.teamIds, inspected.teamIdentifier])],
                })
              }
            >
              Pin this issuer
            </button>
          </div>
        )}
        {pinned && (
          <button type="button" className="btn-ghost mt-3 text-bad" onClick={() => savePolicy({ ...policy, passTypeIds: [], teamIds: [] })}>
            Clear pinned issuer
          </button>
        )}
      </Section>
      {error && <Notice tone="bad">{error}</Notice>}
    </div>
  );
}
