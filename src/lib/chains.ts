// Shared (client + server) chain configuration. Everything happens on Ethereum mainnet:
// names are minted there and payments are made there, in one transaction.
import { mainnet, sepolia } from "viem/chains";
import type { Chain } from "viem";

export const PARENT_NAME = "isworking.eth";

/** All-purpose contact address shown across the site. */
export const CONTACT_EMAIL = "raj@isworking.dev";

export const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true";

export const MINT_CHAIN: Chain = isTestnet ? sepolia : mainnet;

const EXPLORER = isTestnet ? "https://sepolia.etherscan.io" : "https://etherscan.io";

export function explorerTx(_chainId: number, hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function explorerAddress(address: string): string {
  return `${EXPLORER}/address/${address}`;
}
