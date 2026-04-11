import { defineRouting } from "next-intl/routing";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const routing = defineRouting({
  locales: ["cs", "en"],
  defaultLocale: "cs",
  localePrefix: {
    mode: "always", // "as-needed" option hides default locale prefix inside the URL
  },
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
  },
  pathnames: {
    "/": "/",
    "/about/features": {
      cs: "/o-aplikaci/funkce",
    },
    "/about/integrations": {
      cs: "/o-aplikaci/integrace",
    },
    "/about/changelog": {
      cs: "/o-aplikaci/nove-funkce",
    },
    "/about/roadmap": {
      cs: "/o-aplikaci/roadmapa",
    },
    "/blog": {
      cs: "/blog",
    },
    "/blog/[slug]": {
      cs: "/blog/[slug]",
    },
    "/confirm-email-change": {
      cs: "/potvrdit-zmenu-emailu",
    },
    "/contact": {
      cs: "/kontakt",
    },
    "/contact/support": {
      cs: "/kontakt/podpora",
    },
    "/contact/sales": {
      cs: "/kontakt/obchod",
    },
    "/cookies": {
      cs: "/cookies",
    },
    "/app": {
      cs: "/aplikace",
    },
    "/w/[workspaceSlug]": {
      cs: "/w/[workspaceSlug]",
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
    "/post-auth": "/post-auth",
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
    "/account/[...rest]": {
      cs: "/ucet/[...rest]",
    },
    "/account/preferences": {
      cs: "/ucet/preference",
    },
    "/account/security": {
      cs: "/ucet/zabezpeceni",
    },
    "/sign-up": {
      cs: "/registrace",
    },
    "/verify-email": {
      cs: "/overit-email",
    },
    "/verify-email/complete": "/verify-email/complete",
    "/invite/[token]": "/invite/[token]",
    "/invite/[token]/accept": "/invite/[token]/accept",
    "/invite/[token]/start": "/invite/[token]/start",
  },
});

export type AppLocale = (typeof routing.locales)[number];
