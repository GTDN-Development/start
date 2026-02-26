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
    "/dashboard": {
      cs: "/prehled",
    },
    "/forgot-password": {
      cs: "/zapomenute-heslo",
    },
    "/gdpr": {
      cs: "/gdpr",
    },
    "/login": {
      cs: "/prihlasit-se",
    },
    "/pricing": {
      cs: "/cenik",
    },
    "/projects": {
      cs: "/projekty",
    },
    "/reset-password": {
      cs: "/obnovit-heslo",
    },
    "/account": {
      cs: "/ucet",
    },
    "/sign-up": {
      cs: "/registrace",
    },
    "/verify-email": {
      cs: "/overit-email",
    },
  },
});
