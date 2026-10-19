import { isServiceAccount } from "@/lib/devcon/gwallet";
import { fail, handle } from "@/lib/server/http";
import { googleKeys } from "@/lib/server/devcon";

/**
 * Public signing keys for a Google service account, fetched from Google. Proxied so
 * the browser can verify a Google Wallet link without cross-origin issues; only the
 * (public) service-account email is sent here, never the link itself.
 */
export const GET = handle(async (req: Request) => {
  const iss = new URL(req.url).searchParams.get("iss");
  if (!isServiceAccount(iss)) return fail("Invalid issuer");
  return Response.json({ keys: await googleKeys(iss) }, { headers: { "Cache-Control": "public, max-age=3600" } });
});
