import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };

let logo: Promise<string> | null = null;
const logoDataUrl = () =>
  (logo ??= readFile(join(process.cwd(), "public/logo.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`));

/** Shared OG card: Catppuccin Mocha background, logo, a big name and a caption. */
export async function ogCard({ label, caption }: { label: string; caption: string }) {
  const src = await logoDataUrl();
  const size = label.length > 16 ? 64 : label.length > 10 ? 84 : 104;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#1e1e2e",
          backgroundImage:
            "radial-gradient(circle at 85% 0%, rgba(116,199,236,0.22), transparent 55%), radial-gradient(circle at 0% 100%, rgba(43,127,163,0.25), transparent 50%)",
          color: "#cdd6f4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={72} height={72} alt="" />
          <div style={{ fontSize: 34, color: "#a6adc8", display: "flex" }}>get.isworking.dev</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: size, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
            <span style={{ color: "#74c7ec" }}>{label}</span>
            <span style={{ color: "#eef1ff" }}>.isworking.eth</span>
          </div>
          <div style={{ fontSize: 36, color: "#a6adc8", display: "flex" }}>{caption}</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
