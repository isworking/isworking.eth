// Local-fork safety: when the server runs against a mainnet fork, a wallet still
// pointed at real Ethereum would send real money. The registrar only exists on the
// fork, so "can this RPC see the registrar's code?" tells the two apart.
import type { Address } from "viem";

type Requester = { request: (args: { method: "eth_getCode"; params: [Address, "latest"] }) => Promise<unknown> };

export async function seesContract(client: Requester, address: Address): Promise<boolean> {
  try {
    const code = await client.request({ method: "eth_getCode", params: [address, "latest"] });
    return typeof code === "string" && code !== "0x" && code.length > 2;
  } catch {
    return false;
  }
}

export const FORK_WALLET_ERROR =
  "Your wallet is connected to real Ethereum, not the local fork. Point its Ethereum RPC at http://127.0.0.1:8545 first, or this would spend real money.";
