import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/chains";

const SOURCE_URL = process.env.NEXT_PUBLIC_SOURCE_URL;

const mail = (subject?: string) => (
  <a className="link" href={`mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`}>
    {CONTACT_EMAIL}
  </a>
);

const faqs: { q: string; a: ReactNode }[] = [
  {
    q: "What does the $0.99 pay for?",
    a: "The $0.99 (gas not included) is a one-time fee for the domain, and it helps keep things running so I can build good things. Gas is passed on at cost; it's the network fee to mint your name on Ethereum.",
  },
  {
    q: "Is it really mine?",
    a: "Yes. It's minted on Ethereum mainnet through the ENS Name Wrapper, straight to your wallet, as a token you hold. Point it at any address, add a profile and avatar, or set it as your primary name in the ENS app so apps show it instead of your address.",
  },
  {
    q: "How long do I keep it?",
    a: "Forever. Names are permanent: no renewals, no yearly fees. Names are only revoked for abuse (see below).",
  },
  {
    q: "Is this open source?",
    a: (
      <>
        Yes, all of it: the website, the server code and the smart contract.{" "}
        {SOURCE_URL ? (
          <>
            <a className="link" href={SOURCE_URL} target="_blank" rel="noreferrer">
              Read the source
            </a>
            , check how it works, or run your own.
          </>
        ) : (
          "Check how it works, or run your own."
        )}{" "}
        It&apos;s open to everyone: no allowlists, no applications, anyone with a wallet can claim a name.
      </>
    ),
  },
  {
    q: "Is it anonymous? What do you store?",
    a: "There are no accounts, emails, passwords, analytics or tracking cookies, and no database: your wallet is your login, and everything about your name (who bought it, what was paid, which discount) is on Ethereum, public like any other transaction. A Devcon claim records only an anonymous hash of your ticket. Connecting through WalletConnect goes through Reown's relay, which sees the connection, not your identity.",
  },
  {
    q: "How is it secured?",
    a: "Buying is a single transaction with an open-source contract: it takes your payment, sends it straight to the isworking.eth wallet and mints the name to you, all at once, or nothing happens at all. The contract never holds money. It can only create or revoke isworking.eth subnames; it can't move isworking.eth or touch any other name. All of its data (price, coupons, reserved names, sales) lives on-chain for anyone to check. Discount codes are stored only as hashes, and each discount is signed for one name and one wallet, so nobody can copy your code from a pending transaction.",
  },
  {
    q: "Technical details",
    a: "Names are wrapped ENS subnames of isworking.eth on Ethereum mainnet (ERC-1155 tokens in the ENS Name Wrapper) with no fuses burned. They use the official ENS Public Resolver with your ETH address set at mint, and they work as primary names, including ENSIP-19 multichain primary names. You pay in ETH (priced live with Chainlink ETH/USD) or USDT, USDC or DAI, on Ethereum. There's no database: the registrar contract is the source of truth, and it sits behind a small, swappable interface so the service can move to ENSv2 without changing your name.",
  },
  {
    q: "Can a name be taken back?",
    a: "Only for abuse: impersonation, scams, or anything illegal. If a name is revoked, its owner is refunded the name fee, pro-rated over the first year, and nobody else can claim the name for 30 days.",
  },
  {
    q: "I'm going to Devcon 8. Is it free?",
    a: "Yes, completely, gas included, until Devcon 8 ends on November 6, 2026. Drop your Devcon 8 Apple Wallet pass into the checkout, or paste your Google Wallet link, and just sign a message. Your ticket is checked inside your browser; only an anonymous fingerprint leaves your device, so one ticket can't claim many names.",
  },
  {
    q: "Non-profit or open-source project?",
    a: (
      <>
        If you&apos;re a non-commercial entity or an open-source project, email {mail("Sponsorship request")} and I&apos;ll
        sponsor you, with anywhere from 50% to 100% off.
      </>
    ),
  },
  {
    q: "Something went wrong, or I have a question",
    a: <>Email {mail()}, for anything at all. If a checkout had trouble, include the order ID shown on screen.</>,
  },
];

export function Faq() {
  return (
    <section className="mx-auto mt-20 max-w-2xl">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-fg-strong">Questions</h2>
      <p className="mt-2 text-center text-sm text-muted">Open source, open to everyone, no accounts.</p>
      <div className="mt-6 divide-y divide-border border-y border-border">
        {faqs.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-fg-strong">
              {f.q}
              <span className="text-faint transition-transform duration-200 group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <div className="mt-2 text-sm leading-relaxed text-muted">{f.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
