"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, usePublicClient, useWalletClient } from "wagmi";
import { MINT_CHAIN } from "@/lib/chains";
import type { PublicConfig } from "@/lib/config-types";
import { FORK_WALLET_ERROR, seesContract } from "@/lib/fork-check";
import { api } from "@/lib/format";

/** Local-fork state: whether the browser's RPC and the connected wallet are both on the fork. */
export function useForkSafety() {
  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => api<PublicConfig>("/api/config") });
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const { address } = useConnection();
  const { data: wallet } = useWalletClient();
  const local = !!config?.localFork;
  const check = useQuery({
    queryKey: ["fork-safety", config?.registrar, address, !!wallet],
    enabled: local && !!client,
    refetchInterval: 15_000,
    queryFn: async () => ({
      browserOk: await seesContract(client!, config!.registrar),
      walletOk: wallet ? await seesContract(wallet as never, config!.registrar) : null,
    }),
  });
  return { local, browserOk: check.data?.browserOk ?? true, walletOk: check.data?.walletOk ?? null };
}

/** Throws before sending anything if a local-fork test would hit real Ethereum. */
export async function assertSafeToSend(config: PublicConfig | undefined, wallet: unknown) {
  if (!config?.localFork || !wallet) return;
  if (!(await seesContract(wallet as never, config.registrar))) throw new Error(FORK_WALLET_ERROR);
}

export function ForkGuard() {
  const { local, browserOk, walletOk } = useForkSafety();
  if (!local) return null;
  const bad = !browserOk || walletOk === false;
  return (
    <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6`}>
      <div className={`rounded-xl px-4 py-2.5 text-sm ${bad ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"}`}>
        <b>Local fork mode.</b>{" "}
        {!browserOk
          ? "The browser is reading real Ethereum: add NEXT_PUBLIC_RPC_URL_1=http://127.0.0.1:8545 to .env.local and restart `bun run dev`."
          : walletOk === false
            ? FORK_WALLET_ERROR
            : "Server, browser and wallet are on the fork. Nothing here costs real money."}
      </div>
    </div>
  );
}
