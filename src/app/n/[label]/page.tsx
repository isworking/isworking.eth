import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/header";
import { DotField } from "@/components/motion";

type Props = { params: Promise<{ label: string }> };

const clean = (l: string) => decodeURIComponent(l).toLowerCase().slice(0, 63);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const label = clean((await params).label);
  return {
    title: `${label}.isworking.eth`,
    description: `${label}.isworking.eth is working. Get your own name.isworking.eth for $0.99.`,
    openGraph: { title: `${label}.isworking.eth`, description: "Get your own name.isworking.eth" },
  };
}

export default async function NamePage({ params }: Props) {
  const label = clean((await params).label);
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div className="absolute inset-x-0 top-0 h-[520px]">
        <DotField />
      </div>
      <Header />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="font-mono text-3xl break-all text-fg-strong sm:text-5xl">
          <span className="text-accent">{label}</span>.isworking.eth
        </h1>
        <p className="mt-4 text-muted">is working.</p>
        <div className="mt-10 flex flex-col gap-2 sm:flex-row">
          <a className="btn-secondary" href={`https://app.ens.domains/${label}.isworking.eth`} target="_blank" rel="noreferrer">
            View on ENS
          </a>
          <Link className="btn-primary" href="/">
            Get your own
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
