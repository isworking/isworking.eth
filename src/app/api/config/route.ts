import type { PublicConfig } from "@/lib/config-types";
import { PARENT_NAME } from "@/lib/chains";
import { handle, json } from "@/lib/server/http";
import { registrarState } from "@/lib/server/registrar";

export const GET = handle(async () => {
  const s = await registrarState();
  const live = s.devcon.endsAt > Date.now() / 1000;
  const config: PublicConfig = {
    parentName: PARENT_NAME,
    registrar: s.address,
    priceCents: s.priceCents,
    treasury: s.treasury,
    relayer: s.relayer,
    tokens: s.tokens,
    localFork: /\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)(:|\/|$)/.test(process.env.RPC_URL_1 ?? ""),
    devcon: {
      enabled: live && (s.policy.devcon.acceptPkpass || s.policy.devcon.acceptGoogle),
      percentOff: s.devcon.percentOff,
      sponsorGas: s.devcon.sponsored,
      endsAt: s.devcon.endsAt,
      acceptPkpass: s.policy.devcon.acceptPkpass,
      acceptGoogle: s.policy.devcon.acceptGoogle,
      googleServerVerify: s.policy.devcon.googleServerVerify,
      googleIssuers: s.policy.devcon.googleIssuers,
      passTypeIds: s.policy.devcon.passTypeIds,
      teamIds: s.policy.devcon.teamIds,
      minSigningTime: s.policy.devcon.minSigningTime,
    },
  };
  return json(config, 200, "public, max-age=15");
});
