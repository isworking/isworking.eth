"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { parseEventLogs, type Address, type Hash } from "viem";
import { useConnection, usePublicClient, useSwitchChain, useWalletClient, useWriteContract } from "wagmi";
import type { PublicConfig } from "@/lib/config-types";
import { api } from "@/lib/format";
import { assertSafeToSend } from "../fork-guard";
import { MINT_CHAIN } from "@/lib/chains";
import { REGISTRAR_ABI, REGISTRAR_ADDRESS } from "@/lib/registrar";

/** Reads and writes the registrar from the admin's own wallet. */
export function useRegistrar() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const qc = useQueryClient();
  const { chainId } = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { data: walletClient } = useWalletClient();
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api<PublicConfig>("/api/config") });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<Hash | null>(null);

  const read = <T,>(functionName: string, args: unknown[] = []) =>
    client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName, args } as never) as Promise<T>;

  /** Sends a transaction from the connected wallet, waits for it, then refreshes everything. */
  async function send(
    name: string,
    request: { address?: Address; abi?: readonly unknown[]; functionName: string; args?: unknown[]; value?: bigint },
  ): Promise<boolean> {
    setBusy(name);
    setError(null);
    try {
      await assertSafeToSend(config, walletClient);
      if (chainId !== MINT_CHAIN.id) await switchChainAsync({ chainId: MINT_CHAIN.id });
      const hash = await writeContractAsync({
        chainId: MINT_CHAIN.id,
        address: request.address ?? REGISTRAR_ADDRESS!,
        abi: (request.abi ?? REGISTRAR_ABI) as typeof REGISTRAR_ABI,
        functionName: request.functionName,
        args: request.args ?? [],
        value: request.value,
      } as never);
      setLastTx(hash);
      const receipt = await client!.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("The transaction reverted");
      await qc.invalidateQueries();
      return true;
    } catch (e) {
      const err = e as { shortMessage?: string; message?: string };
      const msg = err.shortMessage || err.message || "Transaction failed";
      setError(/reject|denied/i.test(msg) ? "You cancelled the transaction" : msg.split("\n")[0]);
      return false;
    } finally {
      setBusy(null);
    }
  }

  return { client, read, send, busy, error, setError, lastTx, address: REGISTRAR_ADDRESS };
}

export type RegistrarEvent = ReturnType<typeof parseEventLogs<typeof REGISTRAR_ABI>>[number] & { timestamp?: number };

/** Every event the registrar ever emitted (the on-chain history of sales, coupons, revokes…). */
export function useRegistrarEvents() {
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  return useQuery({
    queryKey: ["registrar-events", REGISTRAR_ADDRESS],
    enabled: !!client && !!REGISTRAR_ADDRESS,
    staleTime: 30_000,
    queryFn: async (): Promise<RegistrarEvent[]> => {
      const from = (await client!.readContract({ address: REGISTRAR_ADDRESS!, abi: REGISTRAR_ABI, functionName: "deployedAt" })) as bigint;
      const head = await client!.getBlockNumber();
      const step = BigInt(10_000); // most RPCs cap eth_getLogs ranges
      const logs = [];
      for (let start = from; start <= head; start += step) {
        const end = start + step - BigInt(1) > head ? head : start + step - BigInt(1);
        logs.push(...(await client!.getLogs({ address: REGISTRAR_ADDRESS!, fromBlock: start, toBlock: end })));
      }
      const events = parseEventLogs({ abi: REGISTRAR_ABI, logs }) as RegistrarEvent[];
      // Timestamps for the newest few hundred events, for display.
      const blocks = [...new Set(events.slice(-300).map((e) => e.blockNumber))];
      const times = new Map<bigint, number>();
      await Promise.all(
        blocks.map(async (b) => times.set(b, Number((await client!.getBlock({ blockNumber: b })).timestamp))),
      );
      return events.map((e) => ({ ...e, timestamp: times.get(e.blockNumber) }));
    },
  });
}
