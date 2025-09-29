export type NavigationLink = {
  name: string;
  href: string;
};

export type NavigationDropdown = {
  name: string;
  items: NavigationLink[];
};

export type NavigationItem = NavigationLink | NavigationDropdown;

export const navigation: NavigationItem[] = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Services",
    items: [
      {
        name: "Web Development",
        href: "/services/web-development",
      },
      {
        name: "Mobile Apps",
        href: "/services/mobile-apps",
      },
      {
        name: "Consulting",
        href: "/services/consulting",
      },
      {
        name: "Support",
        href: "/services/support",
      },
    ],
  },
  {
    name: "Products",
    items: [
      {
        name: "SaaS Platform",
        href: "/products/saas-platform",
      },
      {
        name: "API Tools",
        href: "/products/api-tools",
      },
      {
        name: "Analytics",
        href: "/products/analytics",
      },
    ],
  },
  {
    name: "Blog",
    href: "/blog",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];
