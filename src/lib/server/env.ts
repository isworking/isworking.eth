import "server-only";
import type { Hex } from "viem";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return v;
}

export const env = {
  /**
   * The app's hot key. It signs discount vouchers (the registrar only honours vouchers
   * signed by its `relayer`) and sends sponsored claims, paying their gas.
   */
  get relayerKey(): Hex {
    const k = required("RELAYER_PRIVATE_KEY");
    return (k.startsWith("0x") ? k : `0x${k}`) as Hex;
  },
  rpcUrl(chainId: number): string | undefined {
    return process.env[`RPC_URL_${chainId}`] || undefined;
  },
};
