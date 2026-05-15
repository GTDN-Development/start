import { getPublicAppUrl } from "@/config/public-env";
import { GitHubIcon, InstagramIcon, TwitterXIcon, YoutubeIcon } from "@/components/ui/icon-brand";
import type { AppIcon } from "@/types/icons";

type ProductAuthor = {
  name: string;
  url: string;
};

type ProductSocialLink = {
  name: string;
  href: string;
  icon: AppIcon;
};

type ProductCompany = {
  name: string;
  legalName: string;
  address: string;
  id: string;
  vatId?: string;
  registration?: {
    court: string;
    fileNumber: string;
  };
  contact: {
    email: string;
    phone?: string;
    support: {
      email: string;
    };
    sales: {
      email: string;
      phone: string;
    };
  };
};

export const product = {
  // Adopted products should replace every value in this file before launch.
  site: {
    name: "Start App",
    defaultTitle: "Start App",
    defaultDescription:
      "A production-ready white-label application with authentication, account management, organizations, and deployment foundations.",
    domain: "example.com",
    url: getPublicAppUrl(),
  },
  company: {
    name: "FBLS Tech s.r.o.",
    legalName: "FBLS Tech s.r.o.",
    address: "Moravská 854/2, Doubravka, 312 00 Plzeň",
    id: "19433166",
    vatId: "CZ19433166",
    registration: {
      court: "Krajský soud v Plzni",
      fileNumber: "C 43916/KSPL",
    },
    contact: {
      email: "hello@example.com",
      phone: "+420123456789",
      support: {
        email: "support@example.com",
      },
      sales: {
        email: "sales@example.com",
        phone: "+420123456789",
      },
    },
  } satisfies ProductCompany,
  socialLinks: [
    {
      name: "Instagram",
      href: "https://www.instagram.com/example/",
      icon: InstagramIcon,
    },
    {
      name: "Twitter",
      href: "https://x.com/example",
      icon: TwitterXIcon,
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@example",
      icon: YoutubeIcon,
    },
    {
      name: "GitHub",
      href: "https://github.com/example",
      icon: GitHubIcon,
    },
  ] satisfies ProductSocialLink[],
  metadata: {
    authors: [
      {
        name: "Example Company",
        url: "https://www.example.com",
      },
    ] as ProductAuthor[],
  },
} as const;
