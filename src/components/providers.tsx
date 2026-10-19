"use client";

import { createAppKit, useAppKitTheme } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { networks, projectId, wagmiAdapter } from "@/lib/wagmi";
import { MINT_CHAIN } from "@/lib/chains";
import { ThemeContext, readTheme, resolveTheme, type ThemeChoice } from "./theme";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://get.isworking.dev";

// Called at module scope (on the server too): AppKit's hooks require it during SSR.
createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    defaultNetwork: networks.find((n) => n.id === MINT_CHAIN.id) ?? networks[0],
    metadata: {
      name: "get.isworking.dev",
      description: "Get your own name.isworking.eth",
      url: typeof window !== "undefined" ? window.location.origin : siteUrl,
      icons: [`${siteUrl}/logo.png`],
    },
    // Wallets only: no email, no socials, no accounts.
    features: { email: false, socials: false, analytics: false, swaps: false, onramp: false, send: false, history: false },
    enableWalletGuide: false,
    themeMode: resolveTheme(readTheme()),
    themeVariables: {
      "--w3m-accent": "#3b8fb3",
      "--w3m-border-radius-master": "2px",
      "--w3m-font-family": "var(--font-geist-sans), system-ui, sans-serif",
    },
  });

function AppKitThemeSync({ theme }: { theme: "light" | "dark" }) {
  const { setThemeMode } = useAppKitTheme();
  useEffect(() => setThemeMode(theme), [theme, setThemeMode]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // Start from the server's defaults so hydration matches, then read the real values.
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    on();
    setChoice(readTheme()); // eslint-disable-line react-hooks/set-state-in-effect
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const resolved = choice === "system" ? (systemDark ? "dark" : "light") : choice;

  const setTheme = (t: ThemeChoice) => {
    setChoice(t);
    try {
      if (t === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", t);
    } catch {}
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  };

  return (
    <ThemeContext.Provider value={{ choice, resolved, setTheme }}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
        <QueryClientProvider client={queryClient}>
          <AppKitThemeSync theme={resolved} />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeContext.Provider>
  );
}
