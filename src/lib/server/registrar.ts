import "server-only";
import { BaseError, ContractFunctionRevertedError, getAddress, isAddress, keccak256, toBytes, type Address, type Hex } from "viem";
import { normalize as ensNormalize } from "viem/ens";
import { PARENT_NAME } from "../chains";
import type { DevconProof } from "../devcon/types";
import {
  REGISTRAR_ABI,
  REGISTRAR_ADDRESS,
  STABLECOINS,
  ZERO32,
  claimMessage,
  couponHash,
  devconCode,
  parsePolicy,
  ticketOf,
  voucherDomain,
  VOUCHER_TYPES,
  type Policy,
  type Voucher,
} from "../registrar";
import { publicClient, relayerAccount, relayerWallet } from "./clients";
import { validateDevconProof } from "./devcon";
import { OrderError } from "./errors";

const VOUCHER_TTL = 20 * 60;

export function registrar(): Address {
  if (!REGISTRAR_ADDRESS) throw new OrderError("Minting isn't set up yet, check back soon", 503);
  return REGISTRAR_ADDRESS;
}

const read = <T,>(functionName: string, args: unknown[] = []) =>
  publicClient().readContract({ address: registrar(), abi: REGISTRAR_ABI, functionName, args } as never) as Promise<T>;

export type RegistrarState = {
  address: Address;
  priceCents: number;
  treasury: Address;
  relayer: Address;
  devcon: { percentOff: number; sponsored: boolean; endsAt: number };
  tokens: { symbol: string; address: Address; decimals: number }[];
  policy: Policy;
};

let cache: { at: number; state: RegistrarState } | null = null;

/** Everything the app needs from the contract (cached for 20 s). */
export async function registrarState(): Promise<RegistrarState> {
  if (cache && Date.now() - cache.at < 20_000) return cache.state;
  const address = registrar();
  const [priceCents, treasury, relayer, pct, sponsored, endsAt, policy, ...decimals] = await Promise.all([
    read<number>("priceCents"),
    read<Address>("treasury"),
    read<Address>("relayer"),
    read<number>("devconPercentOff"),
    read<boolean>("devconSponsored"),
    read<bigint>("devconEndsAt"),
    read<string>("policy"),
    ...STABLECOINS.map((t) => read<number>("tokenDecimals", [t.address])),
  ]);
  const state: RegistrarState = {
    address,
    priceCents: Number(priceCents),
    treasury,
    relayer,
    devcon: { percentOff: Number(pct), sponsored: sponsored && Number(pct) === 100, endsAt: Number(endsAt) },
    tokens: STABLECOINS.filter((_, i) => Number(decimals[i]) > 0),
    policy: parsePolicy(policy),
  };
  cache = { at: Date.now(), state };
  return state;
}

export type LabelCheck = { ok: true; label: string; name: string } | { ok: false; label?: string; reason: string; retryable?: boolean };

export function normalizeLabel(input: string): LabelCheck {
  const raw = input.trim().toLowerCase().replace(/\.isworking\.eth$/, "");
  if (!raw) return { ok: false, reason: "Enter a name" };
  if (raw.includes(".")) return { ok: false, reason: "Dots aren't allowed in a name" };
  try {
    const label = ensNormalize(raw);
    if (new TextEncoder().encode(label).length > 63) return { ok: false, reason: "That name is too long" };
    return { ok: true, label, name: `${label}.${PARENT_NAME}` };
  } catch {
    return { ok: false, reason: "That name contains characters ENS doesn't allow" };
  }
}

/** Normalises a name and checks it's claimable right now, with a precise reason if not. */
export async function checkLabel(input: string): Promise<LabelCheck> {
  const n = normalizeLabel(input);
  if (!n.ok) return n;
  try {
    const { policy } = await registrarState();
    if ([...n.label].length < policy.minLabelLength) {
      return { ok: false, label: n.label, reason: `Names must be at least ${policy.minLabelLength} characters` };
    }
    const lh = keccak256(toBytes(n.label));
    const [isReserved, lockedUntil, free] = await Promise.all([
      read<boolean>("reserved", [lh]),
      read<bigint>("lockedUntil", [lh]),
      read<boolean>("available", [n.label]),
    ]);
    if (isReserved) return { ok: false, label: n.label, reason: "This name is reserved" };
    if (Number(lockedUntil) > Date.now() / 1000) {
      const date = new Date(Number(lockedUntil) * 1000).toLocaleDateString("en", { dateStyle: "medium" });
      return { ok: false, label: n.label, reason: `This name was recently revoked and can be claimed again on ${date}` };
    }
    if (!free) return { ok: false, label: n.label, reason: "Already taken" };
    return n;
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, label: n.label, reason: e.message, retryable: true };
    console.error("availability check failed", e);
    return { ok: false, label: n.label, reason: "Couldn't reach Ethereum, try again", retryable: true };
  }
}

function revertName(e: unknown): string | null {
  if (!(e instanceof BaseError)) return null;
  const r = e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null;
  if (!r) return null;
  return r.data?.errorName ?? r.reason ?? r.signature ?? e.shortMessage;
}

/** Turns a contract revert into something a buyer can act on. */
export function friendlyRevert(e: unknown): OrderError | null {
  const reason = revertName(e);
  if (!reason) return null;
  if (/NameTaken/.test(reason)) return new OrderError("Already taken");
  if (/NameReserved/.test(reason)) return new OrderError("This name is reserved");
  if (/NameLocked/.test(reason)) return new OrderError("This name was recently revoked and is locked for now");
  if (/CouponUnusable/.test(reason)) return new OrderError("That code can't be used (expired, used up or turned off)");
  if (/TicketUnusable/.test(reason)) return new OrderError("This ticket or wallet has already claimed a Devcon name, or Devcon has ended");
  if (/ERC1155|Receiver/i.test(reason)) {
    return new OrderError("Your wallet can't receive ENS names (a smart account without ERC-1155 support). Try another wallet.");
  }
  if (/StalePrice/.test(reason)) return new OrderError("The ETH price feed is out of date; pay with a stablecoin or try again later", 503);
  return new OrderError("Minting is temporarily unavailable, please try again later", 503);
}

export type IssuedVoucher = {
  label: string;
  voucher: { labelhash: Hex; owner: Address; codeHash: Hex; ticket: Hex; deadline: string };
  signature: Hex;
  percentOff: number;
  sponsored: boolean;
  /** Price after the discount, in US cents. */
  priceCents: number;
  /** The coupon applied: the code typed, or the ticket's DEVCON8_ code. */
  code: string | null;
  claimMessage: string | null;
};

/**
 * Signs a discount voucher for one name and one owner. The contract re-checks the
 * coupon / ticket state; this also simulates the mint so nobody pays for a name
 * that can't be minted to their wallet.
 */
export async function issueVoucher(input: {
  label: string;
  owner: string;
  coupon?: string | null;
  devcon?: DevconProof | null;
}): Promise<IssuedVoucher> {
  if (!isAddress(input.owner)) throw new OrderError("Connect a wallet first");
  const owner = getAddress(input.owner);
  const check = await checkLabel(input.label);
  if (!check.ok) throw new OrderError(check.reason, check.retryable ? 503 : 400);
  const state = await registrarState();

  let codeHash: Hex = ZERO32;
  let ticket: Hex = ZERO32;
  let code: string | null = null;
  if (input.devcon) {
    if (Date.now() / 1000 > state.devcon.endsAt) throw new OrderError("The Devcon discount has ended");
    const res = await validateDevconProof(input.devcon, state.policy);
    if (!res.ok) throw new OrderError(res.reason);
    ticket = ticketOf(res.fingerprint);
    code = devconCode(ticket);
    const [used, claimed] = await Promise.all([read<boolean>("ticketUsed", [ticket]), read<boolean>("devconClaimed", [owner])]);
    if (used) throw new OrderError("This ticket has already been used to claim a name");
    if (claimed) throw new OrderError("This wallet has already claimed a Devcon name");
  } else if (input.coupon?.trim()) {
    codeHash = couponHash(input.coupon);
    code = input.coupon.trim().toUpperCase();
  } else {
    throw new OrderError("No discount to apply");
  }

  const deadline = BigInt(Math.floor(Date.now() / 1000) + VOUCHER_TTL);
  const voucher: Voucher = { labelhash: keccak256(toBytes(check.label)), owner, codeHash, ticket, deadline };

  let percentOff: number;
  let sponsored: boolean;
  try {
    [percentOff, sponsored] = (await read<[number, boolean]>("discountOf", [voucher])).map((x, i) =>
      i === 0 ? Number(x) : Boolean(x),
    ) as [number, boolean];
  } catch (e) {
    if (codeHash !== ZERO32) {
      const c = await read<readonly [number, boolean, boolean, number, number, bigint]>("coupons", [codeHash]).catch(() => null);
      throw new OrderError(c && Number(c[0]) > 0 ? "That code has expired, been used up, or been turned off" : "That code isn't valid");
    }
    throw friendlyRevert(e) ?? e;
  }

  const signature = await relayerAccount().signTypedData({
    domain: voucherDomain(state.address),
    types: VOUCHER_TYPES,
    primaryType: "Voucher",
    message: voucher,
  });

  // Simulate the actual mint (with a funded buyer) so failures surface before payment.
  try {
    if (sponsored) {
      await publicClient().simulateContract({
        account: relayerAccount(),
        address: state.address,
        abi: REGISTRAR_ABI,
        functionName: "registerSponsored",
        args: [check.label, owner, voucher, signature],
      });
    } else {
      const cents = BigInt(Math.floor((state.priceCents * (100 - percentOff)) / 100));
      const value = await read<bigint>("quoteWei", [cents]).catch(() => BigInt(0));
      await publicClient().simulateContract({
        account: owner,
        address: state.address,
        abi: REGISTRAR_ABI,
        functionName: "registerWithETH",
        args: [check.label, owner, voucher, signature],
        value,
        stateOverride: [{ address: owner, balance: value + BigInt(10) ** BigInt(18) }],
      });
    }
  } catch (e) {
    const err = friendlyRevert(e);
    if (err) throw err;
    console.warn("voucher simulation failed", e);
  }

  return {
    label: check.label,
    voucher: { ...voucher, deadline: deadline.toString() },
    signature,
    percentOff,
    sponsored,
    priceCents: Math.floor((state.priceCents * (100 - percentOff)) / 100),
    code,
    claimMessage: sponsored ? claimMessage(check.label, owner, deadline) : null,
  };
}

/** Sends a sponsored claim from the relayer (it pays the gas), after the owner's signature checks out. */
export async function relaySponsored(input: {
  label: string;
  voucher: { labelhash: Hex; owner: Address; codeHash: Hex; ticket: Hex; deadline: string };
  signature: Hex;
  ownerSignature: Hex;
}): Promise<Hex> {
  const n = normalizeLabel(input.label);
  if (!n.ok || !isAddress(input.voucher?.owner)) throw new OrderError("Invalid claim");
  const owner = getAddress(input.voucher.owner);
  const voucher: Voucher = { ...input.voucher, owner, deadline: BigInt(input.voucher.deadline) };
  if (voucher.deadline < BigInt(Math.floor(Date.now() / 1000))) throw new OrderError("This claim expired, start again");

  const client = publicClient();
  const ownerOk = await client
    .verifyMessage({ address: owner, message: claimMessage(n.label, owner, voucher.deadline), signature: input.ownerSignature })
    .catch(() => false);
  if (!ownerOk) throw new OrderError("The signature doesn't match your wallet");

  try {
    const { request } = await client.simulateContract({
      account: relayerAccount(),
      address: registrar(),
      abi: REGISTRAR_ABI,
      functionName: "registerSponsored",
      args: [n.label, owner, voucher, input.signature],
    });
    return await relayerWallet().writeContract(request);
  } catch (e) {
    throw friendlyRevert(e) ?? e;
  }
}
