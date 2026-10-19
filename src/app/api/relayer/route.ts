import { formatEther } from "viem";
import { publicClient, relayerAccount } from "@/lib/server/clients";
import { handle, json } from "@/lib/server/http";

/** The relayer's public address and balance (needed to deploy the registrar and to monitor gas). */
export const GET = handle(async () => {
  const address = relayerAccount().address;
  const balance = await publicClient().getBalance({ address });
  return json({ address, balanceEth: formatEther(balance) });
});
