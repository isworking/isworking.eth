"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { DevconProof, DevconPublicPolicy } from "@/lib/devcon/types";
import { DrawnCheck, Spinner } from "./motion";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; checks: string[]; method: "pkpass" | "gwallet" }
  | { kind: "error"; message: string };

type Method = "apple" | "google";

const TicketIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9a2 2 0 0 0 2-2V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1a2 2 0 0 0-2-2Z" />
    <path d="M10 5v14" strokeDasharray="2 2.5" />
  </svg>
);

export function DevconDrop({ policy, onProof }: { policy: DevconPublicPolicy; onProof: (proof: DevconProof | null) => void }) {
  const methods: Method[] = [...(policy.acceptPkpass ? (["apple"] as const) : []), ...(policy.acceptGoogle ? (["google"] as const) : [])];
  const [method, setMethod] = useState<Method>(methods[0] ?? "apple");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [over, setOver] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [link, setLink] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function run(check: () => Promise<{ proof: DevconProof; checks: string[]; method: "pkpass" | "gwallet" }>, fallback: string) {
    setState({ kind: "checking" });
    onProof(null);
    try {
      const res = await check();
      setState({ kind: "ok", checks: res.checks, method: res.method });
      onProof(res.proof);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : fallback });
    }
  }

  const checkFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return setState({ kind: "error", message: "That file is too large for a ticket" });
    // Loaded on demand: the pass parser is only needed by people who use this.
    run(async () => (await import("@/lib/devcon/verify-local")).verifyTicketFile(file, policy), "Couldn't read that pass");
  };
  const checkLink = () => {
    if (link.trim()) run(async () => (await import("@/lib/devcon/verify-local")).verifyGoogleLink(link, policy), "Couldn't check that link");
  };

  const reset = () => {
    setState({ kind: "idle" });
    onProof(null);
  };

  return (
    <div className={`rounded-xl border p-4 transition-colors ${state.kind === "ok" ? "border-ok/40 bg-ok-soft" : "border-border bg-bg-soft"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${state.kind === "ok" ? "bg-ok text-bg" : "bg-card-solid text-accent"}`}>
          {state.kind === "ok" ? <DrawnCheck className="size-5" /> : <TicketIcon />}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          {state.kind === "ok" ? (
            <>
              <p className="font-medium text-fg-strong">
                Devcon 8 ticket verified: {policy.sponsorGas ? "your name is free, gas included" : `${policy.percentOff}% off the name`}
              </p>
              <p className="text-muted">{state.checks.join(" · ")}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-fg-strong">Going to Devcon 8?</p>
              <p className="text-muted">{policy.sponsorGas ? "Your name is free, gas included." : `${policy.percentOff}% off your name.`} Verify your ticket below.</p>
            </>
          )}
        </div>
        {state.kind === "ok" ? (
          <button type="button" className="btn-ghost -mt-1 -mr-2 shrink-0" onClick={reset}>
            Remove
          </button>
        ) : (
          <button type="button" className="btn-ghost -mt-1 -mr-2 shrink-0 text-xs" onClick={() => setShowHow((v) => !v)} aria-expanded={showHow}>
            {showHow ? "Close" : "How it works"}
          </button>
        )}
      </div>

      {state.kind !== "ok" && (
        <div className="mt-4">
          {methods.length > 1 && (
            <div className="mb-3 inline-flex rounded-lg bg-card-solid p-0.5 text-sm" role="tablist">
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={method === m}
                  onClick={() => {
                    setMethod(m);
                    if (state.kind === "error") setState({ kind: "idle" });
                  }}
                  className={`rounded-md px-3 py-1.5 transition-colors ${method === m ? "bg-accent-soft text-fg-strong" : "text-muted hover:text-fg-strong"}`}
                >
                  {m === "apple" ? "Apple Wallet" : "Google Wallet"}
                </button>
              ))}
            </div>
          )}

          {method === "apple" ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => input.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  input.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                checkFile(e.dataTransfer.files[0]);
              }}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-4 text-sm transition-colors ${
                over ? "border-accent bg-accent-soft text-fg-strong" : "border-border-strong text-muted hover:border-accent hover:text-fg-strong"
              }`}
            >
              <input
                ref={input}
                type="file"
                accept=".pkpass,application/vnd.apple.pkpass"
                className="hidden"
                onChange={(e) => {
                  checkFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {state.kind === "checking" ? (
                <>
                  <Spinner /> Checking your pass…
                </>
              ) : (
                <>
                  Drop your <span className="font-mono text-fg-strong">.pkpass</span> here, or <span className="text-accent">choose a file</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="input h-10 font-mono text-xs"
                placeholder="Paste your “Add to Google Wallet” link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  // This sits inside the checkout form, so handle Enter here instead of submitting it.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    checkLink();
                  }
                }}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={checkLink} className="btn-secondary h-10 shrink-0 px-4 text-sm" disabled={!link.trim() || state.kind === "checking"}>
                {state.kind === "checking" ? <Spinner /> : "Verify"}
              </button>
            </div>
          )}

          <p className="mt-2 text-xs text-muted">
            {method === "apple"
              ? "It's the “Add to Apple Wallet” file from your Devcon ticket email. On iPhone it opens straight in Wallet, so download it on a computer."
              : "Long-press (or right-click) the “Add to Google Wallet” button in your Devcon ticket email and copy the link."}
          </p>
          {state.kind === "error" && <p className="mt-2 text-sm text-bad">{state.message}</p>}
        </div>
      )}

      <AnimatePresence initial={false}>
        {showHow && state.kind !== "ok" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="mt-4 space-y-2 border-t border-border pt-3 text-xs leading-relaxed text-muted">
              <li>
                <b className="text-fg">Checked in your browser.</b> Your pass is opened in this tab and its Apple or Google signature is verified here. The
                file is never uploaded; your name, email and ticket QR stay on your device.
              </li>
              <li>
                <b className="text-fg">Only a fingerprint is sent</b>, so one ticket can claim one name: for an Apple pass, its signed list of file hashes
                (no contents); for a Google link, a hash of the ticket ID
                {policy.googleServerVerify ? ", plus the link so the server can re-check Google's signature (then discarded, never stored)" : ""}.
              </li>
              <li>
                {policy.sponsorGas ? (
                  <>
                    <b className="text-fg">Then just sign.</b> One free signature, no transaction: we send the mint and cover the gas.
                  </>
                ) : (
                  <>
                    <b className="text-fg">Then check out as usual</b> with the discount applied.
                  </>
                )}{" "}
                One name per ticket and per wallet, until Devcon 8 ends.
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
