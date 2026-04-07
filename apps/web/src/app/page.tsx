import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// This page only renders when the app is built statically (output: 'export')
export default function RootPage() {
  redirect({ href: "/", locale: routing.defaultLocale });
}
