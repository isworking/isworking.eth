import { extractSaveJwt } from "@/lib/devcon/gwallet";
import { body, fail, handle, json } from "@/lib/server/http";

/**
 * Ticket emails often link "Add to Google Wallet" through the ticket shop, which
 * redirects to https://pay.google.com/gp/v/save/<JWT>. This follows those redirects
 * (HTTPS only, public hosts only, a few hops) and returns the final save link.
 * Nothing is stored.
 */
export const POST = handle(async (req: Request) => {
  const { url } = await body<{ url: string }>(req);
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    return fail("That isn't a link");
  }
  for (let hop = 0; hop < 4; hop++) {
    if (extractSaveJwt(current.toString())) return json({ url: current.toString() });
    if (current.protocol !== "https:" || isPrivateHost(current.hostname)) return fail("That link can't be followed");
    const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(6000) });
    const next = res.headers.get("location");
    if (!next) {
      // Some shops render a page with the save link in it instead of redirecting.
      const text = res.ok ? (await res.text()).slice(0, 500_000) : "";
      const m = text.match(/https:\/\/pay\.google\.com\/gp\/v\/save\/[A-Za-z0-9_.-]+/);
      return m ? json({ url: m[0] }) : fail("Couldn't find a Google Wallet pass behind that link");
    }
    current = new URL(next, current);
  }
  return extractSaveJwt(current.toString()) ? json({ url: current.toString() }) : fail("Couldn't find a Google Wallet pass behind that link");
});

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":")) return true; // raw IPs (v4/v6) aren't ticket shops
  return false;
}
