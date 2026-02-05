import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["cs", "en"],
  defaultLocale: "cs",
  localePrefix: {
    mode: "always", // "as-needed" option is an alternative and should be enabled for apps with a single language
  },
  // pathnames: {
  //   "/": "/",
  //   "/login": {
  //     cs: "/prihlasit-se",
  //   },
  // },
});
