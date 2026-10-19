// Apple Wallet (.pkpass) verification. Runs in the browser and on the server.
//
// A .pkpass is a zip with pass.json, images, a manifest.json listing the SHA-1
// of every file, and a detached PKCS#7 `signature` over manifest.json made with
// the issuer's Apple "Pass Type ID" certificate. Verifying the signature up to
// Apple's root proves the manifest (and so every file it hashes) was issued by
// the holder of that Pass Type ID.
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { unzipSync, strFromU8 } from "fflate";
import { APPLE_ROOTS, APPLE_WWDR_INTERMEDIATES } from "./apple-certs";

export type SignerIdentity = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  organization: string;
  /** Unix seconds from the PKCS#7 signingTime attribute (0 if absent). */
  signingTime: number;
};

export type PassPolicy = {
  passTypeIds: string[];
  teamIds: string[];
  minSigningTime: number;
};

const OID_UID = "0.9.2342.19200300.100.1.1";
const OID_OU = "2.5.4.11";
const OID_O = "2.5.4.10";
const OID_SIGNING_TIME = "1.2.840.113549.1.9.5";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

function parseCert(der: Uint8Array): pkijs.Certificate {
  return pkijs.Certificate.fromBER(toArrayBuffer(der));
}

async function sha1Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", toArrayBuffer(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(bytes));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function subjectValue(cert: pkijs.Certificate, oid: string): string {
  const tv = cert.subject.typesAndValues.find((t) => t.type === oid);
  return tv ? String(tv.value.valueBlock.value) : "";
}

/**
 * Verifies a detached PKCS#7 signature over manifest.json and returns who signed it.
 * `trust` lets tests inject their own CA; production always uses Apple's.
 */
export async function verifyManifestSignature(
  manifest: Uint8Array,
  signature: Uint8Array,
  trust: { roots: string[]; intermediates: string[] } = { roots: APPLE_ROOTS, intermediates: APPLE_WWDR_INTERMEDIATES },
): Promise<SignerIdentity> {
  let signedData: pkijs.SignedData;
  try {
    const contentInfo = pkijs.ContentInfo.fromBER(toArrayBuffer(signature));
    if (contentInfo.contentType !== pkijs.ContentInfo.SIGNED_DATA) throw new Error("not SignedData");
    signedData = new pkijs.SignedData({ schema: contentInfo.content });
  } catch {
    throw new Error("The pass signature is malformed");
  }

  const signer = signedData.signerInfos[0];
  if (!signer) throw new Error("The pass is not signed");

  let signingTime = 0;
  const attr = signer.signedAttrs?.attributes.find((a) => a.type === OID_SIGNING_TIME);
  if (attr) {
    const t = attr.values[0] as asn1js.UTCTime | asn1js.GeneralizedTime;
    if (t && "toDate" in t) signingTime = Math.floor(t.toDate().getTime() / 1000);
  }

  // Passes usually embed the WWDR intermediate, but add Apple's in case they don't.
  signedData.certificates = [
    ...(signedData.certificates ?? []),
    ...trust.intermediates.map((b) => parseCert(b64ToBytes(b))),
  ];

  let result: pkijs.SignedDataVerifyResult;
  try {
    result = await signedData.verify({
      signer: 0,
      data: toArrayBuffer(manifest),
      trustedCerts: trust.roots.map((b) => parseCert(b64ToBytes(b))),
      checkChain: true,
      // Pass certificates expire; what matters is that it was valid when it signed.
      checkDate: signingTime ? new Date(signingTime * 1000) : new Date(),
      extendedMode: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`The pass signature is not valid (${msg})`);
  }
  if (!result.signatureVerified || !result.signerCertificate) {
    throw new Error("The pass signature is not valid");
  }
  if (result.signerCertificateVerified === false) {
    throw new Error("The pass was not signed with an Apple-issued certificate");
  }

  const cert = result.signerCertificate;
  return {
    passTypeIdentifier: subjectValue(cert, OID_UID),
    teamIdentifier: subjectValue(cert, OID_OU),
    organization: subjectValue(cert, OID_O),
    signingTime,
  };
}

/** Checks the signer against the admin's pinned Devcon identity / heuristics. */
export function checkSignerPolicy(id: SignerIdentity, policy: PassPolicy): string | null {
  if (policy.passTypeIds.length && !policy.passTypeIds.includes(id.passTypeIdentifier)) {
    return "This pass wasn't issued by Devcon";
  }
  if (policy.teamIds.length && !policy.teamIds.includes(id.teamIdentifier)) {
    return "This pass wasn't issued by Devcon";
  }
  if (!policy.passTypeIds.length && !policy.teamIds.length) {
    // Not pinned yet: fall back to the certificate's organisation name.
    const blob = `${id.organization} ${id.passTypeIdentifier}`.toLowerCase();
    if (!/devcon|ethereum|pretix/.test(blob)) return "This pass wasn't issued by Devcon";
  }
  if (policy.minSigningTime && id.signingTime && id.signingTime < policy.minSigningTime) {
    return "This pass is from an earlier Devcon";
  }
  return null;
}

export type PassContents = {
  identity: SignerIdentity;
  pass: Record<string, unknown>;
  manifest: Uint8Array;
  signature: Uint8Array;
  /** SHA-1 of pass.json as listed in the signed manifest. */
  passJsonSha1: string;
};

/** Opens a .pkpass, checks every file against the manifest and verifies the signature. */
export async function openPkpass(file: Uint8Array): Promise<PassContents> {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(file);
  } catch {
    throw new Error("This doesn't look like an Apple Wallet pass");
  }
  const manifestBytes = files["manifest.json"];
  const signature = files["signature"];
  const passJson = files["pass.json"];
  if (!manifestBytes || !signature || !passJson) throw new Error("This doesn't look like an Apple Wallet pass");

  const manifest = JSON.parse(strFromU8(manifestBytes)) as Record<string, string>;
  for (const [name, data] of Object.entries(files)) {
    if (name === "manifest.json" || name === "signature" || name.endsWith("/")) continue;
    if (manifest[name] !== (await sha1Hex(data))) throw new Error("The pass has been modified");
  }

  const identity = await verifyManifestSignature(manifestBytes, signature);
  const pass = JSON.parse(strFromU8(passJson)) as Record<string, unknown>;
  if (pass.passTypeIdentifier !== identity.passTypeIdentifier || pass.teamIdentifier !== identity.teamIdentifier) {
    throw new Error("The pass doesn't match its signing certificate");
  }
  return { identity, pass, manifest: manifestBytes, signature, passJsonSha1: manifest["pass.json"] };
}

/** Collects every human-readable string on the pass for content checks. */
export function passText(pass: Record<string, unknown>): string {
  const parts: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(pass);
  return parts.join(" \n ");
}

export function looksLikeDevcon8(text: string): boolean {
  const t = text.toLowerCase();
  if (!t.includes("devcon")) return false;
  return /devcon\s*(8|viii)\b/.test(t) || (/mumbai|india/.test(t) && t.includes("2026"));
}
