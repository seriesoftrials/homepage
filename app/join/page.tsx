import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { placeholderPages } from "@/content/site";

export const metadata: Metadata = { title: "함께하기 · SERIAL" };

export default function JoinPage() {
  return <PlaceholderPage title={placeholderPages.join.title} />;
}
