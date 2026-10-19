import type { Address } from "viem";
import type { DevconPublicPolicy } from "./devcon/types";

export type PublicConfig = {
  parentName: string;
  registrar: Address;
  /** One-time price of a name, in US cents. */
  priceCents: number;
  treasury: Address;
  relayer: Address;
  /** Accepted stablecoins on Ethereum (ETH is always accepted). */
  tokens: { symbol: string; address: Address; decimals: number }[];
  devcon: DevconPublicPolicy & { endsAt: number };
  /** The server talks to a local fork (RPC_URL_1 on localhost): the browser must too. */
  localFork: boolean;
};
