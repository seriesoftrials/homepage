import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";
import { placeholderPages } from "@/content/site";

export const metadata: Metadata = { title: "프로젝트 · SERIAL" };

export default function ProjectsPage() {
  return <PlaceholderPage title={placeholderPages.projects.title} />;
}
