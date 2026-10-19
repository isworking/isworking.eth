"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";
import { MINT_CHAIN } from "@/lib/chains";
import { REGISTRAR_ABI, REGISTRAR_ADDRESS, parsePolicy, type Policy } from "@/lib/registrar";

export type OnchainConfig = {
  admin: Address;
  treasury: Address;
  relayer: Address;
  priceCents: number;
  refundPeriod: number;
  lockPeriod: number;
  devconPercentOff: number;
  devconSponsored: boolean;
  devconEndsAt: number;
  policy: Policy;
};

/** All of the registrar's settings, read live from the contract. */
export function useOnchainConfig() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  return useQuery({
    queryKey: ["onchain-config", REGISTRAR_ADDRESS],
    enabled: !!client && !!REGISTRAR_ADDRESS,
    queryFn: async (): Promise<OnchainConfig> => {
      const r = <T,>(fn: string) => client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: fn } as never) as Promise<T>;
      const [admin, treasury, relayer, priceCents, refundPeriod, lockPeriod, pct, sponsored, endsAt, policy] = await Promise.all([
        r<Address>("admin"),
        r<Address>("treasury"),
        r<Address>("relayer"),
        r<number>("priceCents"),
        r<number>("refundPeriod"),
        r<number>("lockPeriod"),
        r<number>("devconPercentOff"),
        r<boolean>("devconSponsored"),
        r<bigint>("devconEndsAt"),
        r<string>("policy"),
      ]);
      return {
        admin,
        treasury,
        relayer,
        priceCents: Number(priceCents),
        refundPeriod: Number(refundPeriod),
        lockPeriod: Number(lockPeriod),
        devconPercentOff: Number(pct),
        devconSponsored: sponsored,
        devconEndsAt: Number(endsAt),
        policy: parsePolicy(policy),
      };
    },
  });
}
