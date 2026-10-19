import type { Address, Hex } from "viem";
import { body, handle, json } from "@/lib/server/http";
import { relaySponsored } from "@/lib/server/registrar";

/** Sponsored claims: the relayer sends the mint and pays the gas. Returns the tx hash. */
export const POST = handle(async (req: Request) => {
  const b = await body<{
    label: string;
    voucher: { labelhash: Hex; owner: Address; codeHash: Hex; ticket: Hex; deadline: string };
    signature: Hex;
    ownerSignature: Hex;
  }>(req);
  return json({ txHash: await relaySponsored(b) });
});

export const maxDuration = 60;
