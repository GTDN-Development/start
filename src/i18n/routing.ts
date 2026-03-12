import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["cs", "en"],
  defaultLocale: "cs",
  localePrefix: {
    mode: "always", // "as-needed" option hides default locale prefix inside the URL
  },
  pathnames: {
    "/": "/",
    "/about/features": {
      cs: "/o-aplikaci/funkce",
    },
    "/about/integrations": {
      cs: "/o-aplikaci/integrace",
    },
    "/about/roadmap": {
      cs: "/o-aplikaci/roadmapa",
    },
    "/blog": {
      cs: "/blog",
    },
    "/confirm-email-change": {
      cs: "/potvrdit-zmenu-emailu",
    },
    "/contact": {
      cs: "/kontakt",
    },
    "/cookies": {
      cs: "/cookies",
    },
    "/overview": {
      cs: "/prehled",
    },
    "/w/[workspaceSlug]/overview": {
      cs: "/w/[workspaceSlug]/prehled",
    },
    "/w/[workspaceSlug]/settings": {
      cs: "/w/[workspaceSlug]/nastaveni",
    },
    "/w/[workspaceSlug]/settings/members": {
      cs: "/w/[workspaceSlug]/nastaveni/clenove",
    },
    "/forgot-password": {
      cs: "/zapomenute-heslo",
    },
    "/gdpr": {
      cs: "/gdpr",
    },
    "/terms-of-service": {
      cs: "/obchodni-podminky",
    },
    "/sign-in": {
      cs: "/prihlasit-se",
    },
    "/pricing": {
      cs: "/cenik",
    },
    "/reset-password": {
      cs: "/obnovit-heslo",
    },
    "/account": {
      cs: "/ucet",
    },
    "/account/settings/general": "/account/settings/general",
    "/account/settings/security": "/account/settings/security",
    "/account/security": {
      cs: "/ucet/zabezpeceni",
    },
    "/sign-up": {
      cs: "/registrace",
    },
    "/verify-email": {
      cs: "/overit-email",
    },
    "/invite/[token]": "/invite/[token]",
  },
});
