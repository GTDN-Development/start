import type { AppIcon } from "@/types/icons";
import { GitHubIcon, InstagramIcon, TwitterXIcon, YoutubeIcon } from "@/components/ui/icon-brand";

type ExternalLink = {
  name: string;
  href: string;
};

type SocialMediaLink = ExternalLink & {
  icon: AppIcon;
};

export const avatarColorClassNames = [
  "bg-rose-600 text-white",
  "bg-red-600 text-white",
  "bg-orange-600 text-white",
  "bg-amber-700 text-white",
  "bg-emerald-600 text-white",
  "bg-teal-600 text-white",
  "bg-cyan-700 text-white",
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-purple-600 text-white",
  "bg-pink-600 text-white",
] as const;

// Replace or prune these links during product adoption.
const socialMediaLinks = {
  instagram: {
    name: "Instagram",
    href: "https://www.instagram.com/example/",
    icon: InstagramIcon,
  },
  twitter: {
    name: "Twitter",
    href: "https://x.com/example",
    icon: TwitterXIcon,
  },
  youtube: {
    name: "YouTube",
    href: "https://www.youtube.com/@example",
    icon: YoutubeIcon,
  },
  github: {
    name: "GitHub",
    href: "https://github.com/example",
    icon: GitHubIcon,
  },
} as const satisfies Record<string, SocialMediaLink>;

export const socialMediaLinksArray: SocialMediaLink[] = Object.values(socialMediaLinks);
