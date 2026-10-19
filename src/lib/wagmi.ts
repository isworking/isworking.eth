import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { MINT_CHAIN } from "./chains";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

export const networks = [MINT_CHAIN] as unknown as [AppKitNetwork, ...AppKitNetwork[]];

// Optional browser-side RPC, e.g. NEXT_PUBLIC_RPC_URL_1=http://127.0.0.1:8545 for a local fork.
// (Next.js only inlines NEXT_PUBLIC_* variables referenced literally.)
const rpc = process.env.NEXT_PUBLIC_RPC_URL_1;

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  customRpcUrls: rpc ? { [`eip155:${MINT_CHAIN.id}`]: [{ url: rpc }] } : {},
});
