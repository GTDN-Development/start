import type { Metadata } from "next";
import { ColorsShowcase } from "@/components/(dev)/colors/colors-showcase";

export const metadata: Metadata = {
  title: "Color Tokens",
  description: "Development-only palette reference for theme tokens.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ColorsShowcase />;
}
