"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { ForkGuard } from "./fork-guard";
import { ThemeToggle } from "./theme";
import { shortAddress } from "@/lib/format";
import { CONTACT_EMAIL } from "@/lib/chains";

export function WalletButton({ className = "" }: { className?: string }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  return (
    <button
      type="button"
      onClick={() => open(isConnected ? { view: "Account" } : { view: "Connect" })}
      className={`btn-secondary h-9 rounded-lg px-3.5 text-sm ${className}`}
    >
      {isConnected && address ? (
        <>
          <span className="size-2 rounded-full bg-ok" aria-hidden />
          <span className="font-mono">{shortAddress(address)}</span>
        </>
      ) : (
        "Connect wallet"
      )}
    </button>
  );
}

export function Header({ admin = false }: { admin?: boolean }) {
  return (
    <>
    <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" className="group flex items-center gap-2.5" aria-label="get.isworking.dev home">
        <Image
          src="/logo.png"
          alt=""
          width={32}
          height={32}
          className="size-8 transition-transform duration-300 group-hover:-rotate-6"
          priority
        />
        <span className="font-mono text-sm text-fg-strong">
          get<span className="text-faint">.</span>isworking<span className="text-faint">.dev</span>
          {admin && <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs text-accent">admin</span>}
        </span>
      </Link>
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <WalletButton />
      </div>
    </header>
    <ForkGuard />
    </>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 py-10 text-sm text-muted sm:px-6">
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Made by{" "}
          <a className="link" href="https://isworking.dev" target="_blank" rel="noreferrer">
            isworking.dev
          </a>
          .{" "}
          {process.env.NEXT_PUBLIC_SOURCE_URL ? (
            <a className="link" href={process.env.NEXT_PUBLIC_SOURCE_URL} target="_blank" rel="noreferrer">
              Open source
            </a>
          ) : (
            "Open source"
          )}
          . Names live on Ethereum via the{" "}
          <a className="link" href="https://docs.ens.domains/wrapper/overview" target="_blank" rel="noreferrer">
            ENS Name Wrapper
          </a>
          .
        </p>
        <p>
          Questions or problems?{" "}
          <a className="link" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
