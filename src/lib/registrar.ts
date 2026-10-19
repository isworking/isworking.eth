// The IsWorkingRegistrar contract: the source of truth for prices, coupons,
// reserved names, locks, Devcon claims and sales. Shared by browser and server.
import { getAddress, isAddress, keccak256, toBytes, type Address, type Hex } from "viem";
import { MINT_CHAIN } from "./chains";
import { REGISTRAR_ABI } from "./registrar-artifact";

export { REGISTRAR_ABI };

/** Set after deploying from the admin Setup tab. */
export const REGISTRAR_ADDRESS: Address | null = (() => {
  const a = process.env.NEXT_PUBLIC_REGISTRAR_ADDRESS;
  return a && isAddress(a) ? getAddress(a) : null;
})();

/** Chainlink ETH/USD on Ethereum mainnet. */
export const ETH_USD_FEED: Address = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

export type Stablecoin = { symbol: "USDT" | "USDC" | "DAI"; address: Address; decimals: number };

/** Stablecoins the Setup tab can enable (official Ethereum deployments, priced at $1). */
export const STABLECOINS: Stablecoin[] = [
  { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
];

export const ZERO32: Hex = `0x${"0".repeat(64)}`;

export type Voucher = {
  labelhash: Hex;
  owner: Address;
  codeHash: Hex;
  ticket: Hex;
  deadline: bigint;
};

export const NO_VOUCHER = (label: string, owner: Address): Voucher => ({
  labelhash: keccak256(toBytes(label)),
  owner,
  codeHash: ZERO32,
  ticket: ZERO32,
  deadline: BigInt(0),
});

export const voucherDomain = (verifyingContract: Address) => ({
  name: "isworking.eth names",
  version: "1",
  chainId: MINT_CHAIN.id,
  verifyingContract,
});

export const VOUCHER_TYPES = {
  Voucher: [
    { name: "labelhash", type: "bytes32" },
    { name: "owner", type: "address" },
    { name: "codeHash", type: "bytes32" },
    { name: "ticket", type: "bytes32" },
    { name: "deadline", type: "uint64" },
  ],
} as const;

/** Coupon codes are case-insensitive; only their hash is ever stored on-chain. */
export const normalizeCode = (code: string) => code.trim().toUpperCase();
export const couponHash = (code: string): Hex => keccak256(toBytes(normalizeCode(code)));

/** On-chain ticket id for a Devcon ticket fingerprint. */
export const ticketOf = (fingerprint: string): Hex => keccak256(toBytes(`devcon8:${fingerprint}`));

/** Every Devcon ticket is its own single-use coupon, shown as DEVCON8_<id>. */
export function devconCode(ticket: Hex): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = ticket.slice(2);
  return "DEVCON8_" + Array.from({ length: 10 }, (_, i) => alphabet[parseInt(bytes.slice(i * 2, i * 2 + 2), 16) % 32]).join("");
}

/** Checks the contract can't do itself; stored on-chain as JSON (`policy()`), edited in the admin panel. */
export type Policy = {
  minLabelLength: number;
  devcon: {
    acceptPkpass: boolean;
    acceptGoogle: boolean;
    /** The browser also sends the Google Wallet link so the server can re-check it. */
    googleServerVerify: boolean;
    passTypeIds: string[];
    teamIds: string[];
    googleIssuers: string[];
    /** Passes signed before this (unix seconds) are from older Devcons. */
    minSigningTime: number;
  };
};

export const DEFAULT_POLICY: Policy = {
  minLabelLength: 1,
  devcon: {
    acceptPkpass: true,
    acceptGoogle: true,
    googleServerVerify: true,
    passTypeIds: [],
    teamIds: [],
    googleIssuers: [],
    minSigningTime: Date.UTC(2026, 6, 1) / 1000, // Devcon 8 ticket sales opened July 2026
  },
};

export function parsePolicy(json: string | undefined | null): Policy {
  try {
    const p = JSON.parse(json || "{}") as Partial<Policy>;
    return { ...DEFAULT_POLICY, ...p, devcon: { ...DEFAULT_POLICY.devcon, ...(p.devcon ?? {}) } };
  } catch {
    return DEFAULT_POLICY;
  }
}

/** Message the owner signs to ask for a sponsored (free, gas-covered) claim. */
export function claimMessage(label: string, owner: Address, deadline: bigint): string {
  return [
    `Claim ${label}.isworking.eth on get.isworking.dev`,
    "",
    `Owner: ${owner}`,
    `Valid until: ${new Date(Number(deadline) * 1000).toISOString()}`,
    "",
    "Signing this is free and does not send a transaction.",
  ].join("\n");
}
