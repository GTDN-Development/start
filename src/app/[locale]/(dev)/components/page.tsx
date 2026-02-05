import type { Metadata } from "next";
import { ComponentsShowcase } from "@/components/(dev)/components/components-showcase";

export const metadata: Metadata = {
  title: "Component Playground",
  description: "Development-only playground for UI components.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ComponentsShowcase />;
}
