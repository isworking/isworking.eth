import { ogCard, ogSize } from "@/lib/og/card";

export const alt = "Get your name.isworking.eth on get.isworking.dev";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ label: "yourname", caption: "Permanent on-chain ENS names · $0.99 · wallet only" });
}
