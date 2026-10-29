import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { placeholderPages } from "@/content/site";

export const metadata: Metadata = { title: "업데이트 · SERIAL" };

export default function UpdatesPage() {
  return <PlaceholderPage title={placeholderPages.updates.title} />;
}
