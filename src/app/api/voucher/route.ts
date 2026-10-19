import type { DevconProof } from "@/lib/devcon/types";
import { body, handle, json } from "@/lib/server/http";
import { issueVoucher } from "@/lib/server/registrar";

/** { label, owner, coupon? | devcon? } → a signed discount voucher for that name and owner. */
export const POST = handle(async (req: Request) => {
  const b = await body<{ label: string; owner: string; coupon?: string; devcon?: DevconProof }>(req);
  return json(await issueVoucher(b));
});

export const maxDuration = 60;
