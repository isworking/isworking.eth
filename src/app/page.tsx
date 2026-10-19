import { Claim } from "@/components/claim";
import { Footer, Header } from "@/components/header";
import { DotField, NameTicker } from "@/components/motion";
import { Faq } from "@/components/faq";

const NAMES = ["alice", "gm", "builder", "satoshi", "anon", "dev", "you"];

const steps = [
  { t: "Pick a name", d: "Anything ENS allows: letters, numbers, emoji. First come, first served." },
  { t: "Pay from your wallet", d: "ETH, USDT, USDC or DAI on Ethereum, in one transaction. No email, no account." },
  { t: "It's yours, permanently", d: "A real on-chain ENS name on Ethereum, owned by your wallet. Set it as your primary name." },
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div className="absolute inset-x-0 top-0 h-[640px]">
        <DotField />
      </div>
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6">
        <section className="pt-10 pb-12 text-center sm:pt-16">
          <p className="pill mx-auto mb-5 border border-border bg-card-solid text-muted">
            <span className="size-1.5 rounded-full bg-accent" /> Permanent on-chain ENS names · $0.99
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance text-fg-strong sm:text-6xl">
            Your name is working.
          </h1>
          <p className="mx-auto mt-5 text-xl break-all sm:text-3xl">
            <NameTicker names={NAMES} suffix=".isworking.eth" />
          </p>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-muted">
            A real ENS name on Ethereum, minted to your wallet. Use it as your on-chain identity anywhere ENS works.
          </p>
        </section>

        <Claim />

        <section className="mx-auto mt-24 grid max-w-4xl gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-border p-5">
              <span className="font-mono text-sm text-accent">0{i + 1}</span>
              <h3 className="mt-2 font-medium text-fg-strong">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </section>

        <Faq />
      </main>

      <Footer />
    </div>
  );
}
