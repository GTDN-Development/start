import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  LayoutIcon,
  SettingsIcon,
  SearchIcon,
  CookieIcon,
  ShieldIcon,
  MessageSquareIcon,
  PaletteIcon,
  BellIcon,
  SparklesIcon,
} from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
};

const features: Feature[] = [
  {
    title: "Responsive Layout System",
    description:
      "Advanced header with mobile-friendly drawer navigation using Vaul. Supports nested menu items with unified data source that powers both header and footer navigation.",
    icon: LayoutIcon,
  },
  {
    title: "Unified Configuration",
    description:
      "Centralized config folder serving as single source of truth for site metadata, navigation links, contact information, legal content, and business details. Eliminates hardcoded values across components.",
    icon: SettingsIcon,
  },
  {
    title: "SEO-Optimized Foundation",
    description:
      "Comprehensive SEO setup with auto-generated OG images, sitemap, and robots.txt. Perfect default for most projects for optimal search engine visibility that requires almost zero maintenance.",
    icon: SearchIcon,
  },
  {
    title: "GDPR Compliance System",
    description:
      "Customizable EU-compliant consent system with granular controls. Supports analytics, marketing, and functional tracking with user preferences and easy consent management.",
    icon: CookieIcon,
  },
  {
    title: "Privacy Policy Ready",
    description:
      "Pre-built GDPR-compliant privacy policy page with configurable legal information. Includes data processing details, user rights, and cookie usage transparency.",
    icon: ShieldIcon,
  },
  {
    title: "Contact Form with Protection",
    description:
      "Production-ready contact form with Cloudflare Turnstile captcha integration. Features form validation, error handling, and API route submission with proper feedback mechanisms.",
    icon: MessageSquareIcon,
  },
  {
    title: "Advanced Theme Management",
    description:
      "Sophisticated theme switcher supporting light, dark, and system preferences. Uses next-themes for seamless transitions with persistent user preferences and proper SSR handling.",
    icon: PaletteIcon,
  },
  {
    title: "Toast Notification System",
    description:
      "Theme-aware toast notifications using Sonner with consistent styling. Automatically adapts to current theme and provides elegant user feedback for actions and events.",
    icon: BellIcon,
  },
  {
    title: "Hero Component System",
    description:
      "Flexible hero section components with background patterns, content management, and responsive layouts. Includes grid backgrounds, action buttons, and customizable content structures.",
    icon: SparklesIcon,
  },
];

export function FeaturesSection(props: React.ComponentProps<"section">) {
  return (
    <section {...props}>
      <h2 className="text-2xl font-semibold sm:text-3xl">Built-in Features</h2>
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader className="flex flex-col gap-2">
              <feature.icon aria-hidden="true" className="size-5" />
              <h3 className="font-semibold">{feature.title}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
