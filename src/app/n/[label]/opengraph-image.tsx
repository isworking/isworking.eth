import { ogCard, ogSize } from "@/lib/og/card";

export const alt = "An isworking.eth name";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ label: string }> }) {
  const { label } = await params;
  const clean = decodeURIComponent(label).toLowerCase().slice(0, 40);
  return ogCard({ label: clean, caption: "is working. Get yours at get.isworking.dev" });
}
