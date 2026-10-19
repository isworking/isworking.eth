// Google Wallet "Add to Google Wallet" links. Runs in the browser and on the server.
//
// A save link is https://pay.google.com/gp/v/save/<JWT>. The JWT is signed (RS256)
// by the issuer's Google service account, whose public keys Google publishes at
// https://www.googleapis.com/service_accounts/v1/jwk/<service-account-email>.
// Verifying it proves the pass was issued by the holder of that service account.

export type GoogleJwk = { kid: string; n: string; e: string; kty: string; alg?: string };

export type GooglePass = {
  /** Service account that signed the link. */
  iss: string;
  /** Google Wallet issuer IDs found in the class/object IDs (the part before the first dot). */
  issuerIds: string[];
  objectIds: string[];
  /** Every readable string in the payload (event name, venue…) when the link carries them. */
  text: string;
  isEventTicket: boolean;
  iat: number;
};

const b64url = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

/** Pulls the JWT out of a pasted save link (or accepts a bare JWT). */
export function extractSaveJwt(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/save\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/) ?? s.match(/^([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  return m ? m[1] : null;
}

export function decodeJwt(jwt: string): { header: Record<string, unknown>; claims: Record<string, unknown> } {
  const [h, p] = jwt.split(".");
  const dec = (x: string) => JSON.parse(new TextDecoder().decode(b64url(x)));
  return { header: dec(h), claims: dec(p) };
}

export function isServiceAccount(iss: unknown): iss is string {
  return typeof iss === "string" && /^[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/i.test(iss);
}

/** Verifies the signature against the given JWKS and returns what the link says. */
export async function verifySaveJwt(jwt: string, keys: GoogleJwk[]): Promise<GooglePass> {
  const { header, claims } = decodeJwt(jwt);
  if (header.alg !== "RS256") throw new Error("This isn't a Google Wallet link");
  if (claims.aud !== "google" || claims.typ !== "savetowallet") throw new Error("This isn't a Google Wallet link");
  if (!isServiceAccount(claims.iss)) throw new Error("This Google Wallet link has an unknown issuer");
  const jwk = keys.find((k) => k.kid === header.kid) ?? (keys.length === 1 ? keys[0] : undefined);
  if (!jwk) throw new Error("This Google Wallet link's signing key wasn't found");

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const [h, p, sig] = jwt.split(".");
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error("This Google Wallet link's signature isn't valid");

  const payload = (claims.payload ?? {}) as Record<string, unknown>;
  const objects = [...((payload.eventTicketObjects as Record<string, unknown>[]) ?? [])];
  const classes = [...((payload.eventTicketClasses as Record<string, unknown>[]) ?? [])];
  const ids = [
    ...objects.flatMap((o) => [o.id, o.classId]),
    ...classes.map((c) => c.id),
  ].filter((x): x is string => typeof x === "string");
  const parts: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(payload);
  return {
    iss: claims.iss,
    issuerIds: [...new Set(ids.map((id) => id.split(".")[0]).filter(Boolean))],
    objectIds: objects.map((o) => o.id).filter((x): x is string => typeof x === "string"),
    text: parts.join(" \n "),
    isEventTicket: objects.length > 0 || classes.length > 0,
    iat: Number(claims.iat ?? 0),
  };
}

export type GooglePolicy = { issuers: string[] };

/** Pinned issuers can be service-account emails or numeric Wallet issuer IDs. */
export function checkGooglePolicy(p: GooglePass, policy: GooglePolicy, looksLikeDevcon8: (t: string) => boolean): string | null {
  if (!p.isEventTicket) return "This Google Wallet pass isn't an event ticket";
  if (!p.objectIds.length) return "This Google Wallet link has no ticket in it";
  if (policy.issuers.length) {
    const pinned = policy.issuers.some((i) => i === p.iss || p.issuerIds.includes(i));
    if (!pinned) return "This pass wasn't issued by Devcon";
    return null;
  }
  // Not pinned yet: the link itself must say it's Devcon 8.
  if (!looksLikeDevcon8(p.text)) return "Couldn't confirm this is a Devcon 8 ticket";
  return null;
}
