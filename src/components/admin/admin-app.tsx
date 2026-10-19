"use client";

import { useAppKit } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { isAddressEqual, type Address } from "viem";
import { normalize } from "viem/ens";
import { useConnection, usePublicClient } from "wagmi";
import { MINT_CHAIN, PARENT_NAME } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { REGISTRAR_ABI, REGISTRAR_ADDRESS } from "@/lib/registrar";
import { Spinner } from "../motion";
import { CouponsTab } from "./coupons";
import { DevconTab } from "./devcon";
import { NamesTab } from "./names";
import { OverviewTab } from "./overview";
import { SalesTab } from "./sales";
import { SettingsTab } from "./settings";
import { SetupTab } from "./setup";

const TABS = ["Overview", "Setup", "Sales", "Coupons", "Names", "Devcon", "Settings"] as const;
type Tab = (typeof TABS)[number];

/**
 * The admin panel talks to the registrar contract directly from your wallet: there's
 * no server-side login, because the contract itself only accepts admin actions from
 * its admin. Before the registrar exists, the isworking.eth wallet can open Setup.
 */
export function AdminApp() {
  const { open } = useAppKit();
  const { address, isConnected } = useConnection();
  const client = usePublicClient({ chainId: MINT_CHAIN.id });
  const [tab, setTab] = useState<Tab>(REGISTRAR_ADDRESS ? "Overview" : "Setup");

  const admin = useQuery({
    queryKey: ["admin-address", REGISTRAR_ADDRESS],
    enabled: !!client,
    queryFn: async (): Promise<{ admin: Address | null; problem?: string }> => {
      if (REGISTRAR_ADDRESS) {
        const code = await client!.getCode({ address: REGISTRAR_ADDRESS }).catch(() => undefined);
        if (!code || code === "0x") {
          return {
            admin: null,
            problem: `No registrar contract exists at ${REGISTRAR_ADDRESS} on the network this browser reads. Testing on a local fork? Set NEXT_PUBLIC_RPC_URL_1=http://127.0.0.1:8545 in .env.local and restart \`bun run dev\` (and re-run \`bun run fork:setup\` if anvil restarted).`,
          };
        }
        return { admin: (await client!.readContract({ address: REGISTRAR_ADDRESS, abi: REGISTRAR_ABI, functionName: "admin" })) as Address };
      }
      // Not deployed yet: the admin-to-be is the wallet whose primary name is isworking.eth.
      const a = await client!.getEnsAddress({ name: normalize(PARENT_NAME) });
      if (!a || (await client!.getEnsName({ address: a })) !== PARENT_NAME) return { admin: null, problem: `Couldn't resolve ${PARENT_NAME}'s primary-name wallet.` };
      return { admin: a };
    },
  });

  if (admin.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted">
        <Spinner className="size-5" />
      </div>
    );
  }

  const adminAddr = admin.data?.admin ?? null;
  const isAdmin = !!address && !!adminAddr && isAddressEqual(address, adminAddr);
  if (!isAdmin) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="card w-full max-w-sm p-6 text-center">
          <h1 className="text-lg font-semibold text-fg-strong">Admin</h1>
          {admin.data?.problem || admin.isError ? (
            <p className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-left text-sm text-bad">
              {admin.data?.problem ?? "Couldn't read the registrar. Check your RPC settings."}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Connect the {REGISTRAR_ADDRESS ? "registrar's admin wallet" : "wallet whose primary name is isworking.eth"}
              {adminAddr && <span className="font-mono"> ({shortAddress(adminAddr)})</span>}.
            </p>
          )}
          {!isConnected ? (
            <button type="button" className="btn-primary mt-6 w-full" onClick={() => open({ view: "Connect" })}>
              Connect wallet
            </button>
          ) : (
            !admin.data?.problem && (
              <p className="mt-4 text-sm text-bad">
                {shortAddress(address!)} isn&apos;t the admin{adminAddr ? <> ({shortAddress(adminAddr)} is)</> : null}.
                {REGISTRAR_ADDRESS && " On a local fork, `bun run fork:setup -- <your wallet>` makes your wallet the admin."}
              </p>
            )
          )}
        </div>
      </div>
    );
  }

  const tabs = REGISTRAR_ADDRESS ? TABS : (["Setup"] as const);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-bg-soft p-1" aria-label="Admin sections">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${tab === t ? "text-fg-strong" : "text-muted hover:text-fg-strong"}`}
            >
              {tab === t && (
                <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-lg bg-card-solid shadow-card" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </nav>
        <span className="font-mono text-sm text-muted">{shortAddress(address!)}</span>
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mt-6">
        {tab === "Overview" && <OverviewTab />}
        {tab === "Setup" && <SetupTab admin={address!} />}
        {tab === "Sales" && <SalesTab />}
        {tab === "Coupons" && <CouponsTab />}
        {tab === "Names" && <NamesTab />}
        {tab === "Devcon" && <DevconTab />}
        {tab === "Settings" && <SettingsTab />}
      </motion.div>
    </div>
  );
}
