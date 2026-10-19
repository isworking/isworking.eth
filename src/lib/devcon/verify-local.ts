// Browser-only Devcon 8 ticket verification. Nothing here makes a network request:
// the file is read, parsed and checked entirely in this tab.
import { bytesToB64, checkSignerPolicy, looksLikeDevcon8, openPkpass, passText, sha256Hex } from "./pkpass";
import { checkGooglePolicy, decodeJwt, extractSaveJwt, isServiceAccount, verifySaveJwt, type GoogleJwk } from "./gwallet";
import type { DevconProof, DevconPublicPolicy } from "./types";

export type LocalVerification = {
  proof: DevconProof;
  method: "pkpass" | "gwallet";
  /** Short, non-personal description of what was checked. */
  checks: string[];
};

/** Verifies an "Add to Google Wallet" link pasted by the attendee. */
export async function verifyGoogleLink(input: string, policy: DevconPublicPolicy): Promise<LocalVerification> {
  if (!policy.acceptGoogle) throw new Error("Google Wallet passes aren't accepted right now");
  let jwt = extractSaveJwt(input);
  if (!jwt && /^https:\/\//.test(input.trim())) {
    // A shop link that redirects to Google: let the server follow it to the real save link.
    const res = await fetch("/api/devcon/google-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !data.url) throw new Error(data.error || "Couldn't open that link");
    jwt = extractSaveJwt(data.url);
  }
  if (!jwt) throw new Error("Paste the full “Add to Google Wallet” link from your ticket email");
  let iss: unknown;
  try {
    iss = decodeJwt(jwt).claims.iss;
  } catch {
    throw new Error("That link couldn't be read");
  }
  if (!isServiceAccount(iss)) throw new Error("This Google Wallet link has an unknown issuer");
  // Only the issuer's public service-account email is sent, to fetch Google's public keys.
  const res = await fetch(`/api/devcon/google-keys?iss=${encodeURIComponent(iss)}`);
  if (!res.ok) throw new Error("Couldn't reach Google to check the pass, try again");
  const { keys } = (await res.json()) as { keys: GoogleJwk[] };
  const pass = await verifySaveJwt(jwt, keys);
  const err = checkGooglePolicy(pass, { issuers: policy.googleIssuers }, looksLikeDevcon8);
  if (err) throw new Error(err);
  return {
    method: "gwallet",
    proof: {
      method: "gwallet",
      fingerprint: await sha256Hex(`devcon8-gwallet:${pass.objectIds[0]}`),
      ...(policy.googleServerVerify ? { jwt } : {}),
    },
    checks: ["Signed by the issuer's Google account", "Event ticket", policy.googleIssuers.length ? "Issued by Devcon" : "Devcon 8 ticket"],
  };
}

export async function verifyTicketFile(file: File, policy: DevconPublicPolicy): Promise<LocalVerification> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"

  if (isZip || file.name.toLowerCase().endsWith(".pkpass")) {
    if (!policy.acceptPkpass) throw new Error("Wallet passes aren't accepted right now");
    return verifyPkpass(bytes, policy);
  }
  throw new Error("Drop your Apple Wallet pass (.pkpass), or paste your Google Wallet link");
}

async function verifyPkpass(bytes: Uint8Array, policy: DevconPublicPolicy): Promise<LocalVerification> {
  const { identity, pass, manifest, signature } = await openPkpass(bytes);
  const policyError = checkSignerPolicy(identity, {
    passTypeIds: policy.passTypeIds,
    teamIds: policy.teamIds,
    minSigningTime: policy.minSigningTime,
  });
  if (policyError) throw new Error(policyError);
  if (!pass.eventTicket) throw new Error("This pass isn't an event ticket");
  if (pass.voided === true) throw new Error("This ticket has been voided");
  if (!looksLikeDevcon8(passText(pass))) throw new Error("This doesn't look like a Devcon 8 ticket");

  return {
    method: "pkpass",
    proof: { method: "pkpass", manifest: bytesToB64(manifest), signature: bytesToB64(signature) },
    checks: [
      "Signed by Apple-issued certificate",
      `Issuer: ${identity.organization || identity.teamIdentifier}`,
      "Devcon 8 event ticket",
      "Not voided",
    ],
  };
}
