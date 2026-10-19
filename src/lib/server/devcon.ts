import "server-only";
import { checkGooglePolicy, decodeJwt, extractSaveJwt, verifySaveJwt, type GoogleJwk } from "../devcon/gwallet";
import { checkSignerPolicy, looksLikeDevcon8, sha256Hex, verifyManifestSignature } from "../devcon/pkpass";
import type { DevconProof } from "../devcon/types";
import type { Policy } from "../registrar";

const keyCache = new Map<string, { keys: GoogleJwk[]; at: number }>();

/** A Google service account's public signing keys (cached for an hour). */
export async function googleKeys(iss: string): Promise<GoogleJwk[]> {
  const hit = keyCache.get(iss);
  if (hit && Date.now() - hit.at < 3600_000) return hit.keys;
  const res = await fetch(`https://www.googleapis.com/service_accounts/v1/jwk/${encodeURIComponent(iss)}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google key lookup failed (${res.status})`);
  const keys = ((await res.json()) as { keys?: GoogleJwk[] }).keys ?? [];
  keyCache.set(iss, { keys, at: Date.now() });
  return keys;
}

const b64 = (s: string) => new Uint8Array(Buffer.from(s, "base64"));

/**
 * Re-checks a Devcon proof on the server (the browser could be lying) and returns
 * the ticket's anonymous fingerprint. Whether the ticket was already used, and the
 * Devcon end date, are enforced by the contract.
 */
export async function validateDevconProof(
  proof: DevconProof,
  policy: Policy,
): Promise<{ ok: true; fingerprint: string; method: "pkpass" | "gwallet" } | { ok: false; reason: string }> {
  const d = policy.devcon;
  try {
    if (proof.method === "pkpass") {
      if (!d.acceptPkpass) return { ok: false, reason: "Wallet passes aren't accepted right now" };
      if (typeof proof.manifest !== "string" || typeof proof.signature !== "string" || proof.manifest.length > 64_000) {
        return { ok: false, reason: "Invalid ticket proof" };
      }
      const manifest = b64(proof.manifest);
      const identity = await verifyManifestSignature(manifest, b64(proof.signature));
      const err = checkSignerPolicy(identity, { passTypeIds: d.passTypeIds, teamIds: d.teamIds, minSigningTime: d.minSigningTime });
      if (err) return { ok: false, reason: err };
      const passHash = (JSON.parse(Buffer.from(manifest).toString("utf8")) as Record<string, string>)["pass.json"];
      if (!passHash) return { ok: false, reason: "Invalid ticket proof" };
      return { ok: true, method: "pkpass", fingerprint: await sha256Hex(`devcon8-pkpass:${passHash}`) };
    }
    if (proof.method === "gwallet") {
      if (!d.acceptGoogle) return { ok: false, reason: "Google Wallet passes aren't accepted right now" };
      if (typeof proof.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(proof.fingerprint)) {
        return { ok: false, reason: "Invalid ticket proof" };
      }
      if (d.googleServerVerify) {
        // Re-check the link so a modified browser can't fake it. It isn't stored.
        const jwt = typeof proof.jwt === "string" ? extractSaveJwt(proof.jwt) : null;
        if (!jwt) return { ok: false, reason: "Invalid ticket proof" };
        const pass = await verifySaveJwt(jwt, await googleKeys(String(decodeJwt(jwt).claims.iss)));
        const err = checkGooglePolicy(pass, { issuers: d.googleIssuers }, looksLikeDevcon8);
        if (err) return { ok: false, reason: err };
        if ((await sha256Hex(`devcon8-gwallet:${pass.objectIds[0]}`)) !== proof.fingerprint) {
          return { ok: false, reason: "Invalid ticket proof" };
        }
      }
      return { ok: true, method: "gwallet", fingerprint: proof.fingerprint };
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Invalid ticket proof" };
  }
  return { ok: false, reason: "Invalid ticket proof" };
}
