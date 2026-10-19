import "server-only";
import { createPublicClient, createWalletClient, fallback, http, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { MINT_CHAIN } from "../chains";
import { env } from "./env";

let client: PublicClient | null = null;

function transport() {
  const custom = env.rpcUrl(MINT_CHAIN.id);
  // Without a custom RPC we fall back to the chain's public endpoint (rate limited).
  return custom ? fallback([http(custom), http()]) : http();
}

export function publicClient(): PublicClient {
  client ??= createPublicClient({ chain: MINT_CHAIN, transport: transport() }) as PublicClient;
  return client;
}

export function relayerAccount() {
  return privateKeyToAccount(env.relayerKey);
}

export function relayerWallet() {
  return createWalletClient({ account: relayerAccount(), chain: MINT_CHAIN, transport: transport() });
}
