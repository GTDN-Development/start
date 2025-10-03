import type { Cookie } from "@/components/cookies/cookie-policy";

export const cookies: Cookie[] = [
  // Essential Cookies
  {
    name: "CONSENT",
    provider: "Google",
    purpose: "Stores user's cookie consent preferences.",
    duration: "2 years",
    category: "essential",
    storageType: "cookie",
  },
  {
    name: "cookieConsent",
    provider: "Own",
    purpose: "Stores your cookie preferences.",
    duration: "1 year",
    category: "essential",
    storageType: "localStorage",
  },
  {
    name: "PHPSESSID / JSESSIONID",
    provider: "Own",
    purpose: "Identifies user session on the server.",
    duration: "Session",
    category: "essential",
    storageType: "cookie",
  },

  // Google Analytics Cookies
  {
    name: "_ga",
    provider: "Google Analytics",
    purpose: "Used to distinguish users for statistical purposes.",
    duration: "2 years",
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purpose: "Used to persist session state for Google Analytics 4.",
    duration: "2 years",
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_gid",
    provider: "Google Analytics",
    purpose: "Used to distinguish users.",
    duration: "24 hours",
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_gat",
    provider: "Google Analytics",
    purpose: "Used to throttle request rate.",
    duration: "1 minute",
    category: "analytics",
    storageType: "cookie",
  },

  // localStorage Examples
  {
    name: "theme",
    provider: "Own",
    purpose: "Stores user's theme preference (light/dark mode).",
    duration: "Persistent",
    category: "functional",
    storageType: "localStorage",
  },
  {
    name: "language",
    provider: "Own",
    purpose: "Stores user's language preference.",
    duration: "Persistent",
    category: "functional",
    storageType: "localStorage",
  },

  // sessionStorage Examples
  {
    name: "formData",
    provider: "Own",
    purpose: "Temporarily stores form data during the session.",
    duration: "Session",
    category: "functional",
    storageType: "sessionStorage",
  },

  // Google Tag Manager
  // {
  //   name: "_gcl_au",
  //   provider: "Google Tag Manager",
  //   purpose: "Used by Google AdSense for experimenting with advertisement efficiency.",
  //   duration: "3 months",
  //   category: "marketing",
  // },
  // {
  //   name: "_gac_*",
  //   provider: "Google Ads",
  //   purpose: "Contains campaign-related information for the user.",
  //   duration: "90 days",
  //   category: "marketing",
  // },

  // Meta/Facebook Pixel
  // {
  //   name: "_fbp",
  //   provider: "Facebook",
  //   purpose: "Used to deliver targeted advertising and measure ad performance.",
  //   duration: "3 months",
  //   category: "marketing",
  // },
  // {
  //   name: "_fbc",
  //   provider: "Facebook",
  //   purpose: "Stores last visit from a Facebook ad.",
  //   duration: "2 years",
  //   category: "marketing",
  // },
  // {
  //   name: "fr",
  //   provider: "Facebook",
  //   purpose: "Used to display relevant advertisements.",
  //   duration: "3 months",
  //   category: "marketing",
  // },

  // YouTube Embeds
  // {
  //   name: "VISITOR_INFO1_LIVE",
  //   provider: "YouTube",
  //   purpose: "Tries to estimate users' bandwidth when playing videos.",
  //   duration: "6 months",
  //   category: "analytics",
  // },
  // {
  //   name: "YSC",
  //   provider: "YouTube",
  //   purpose: "Registers a unique ID to keep statistics of what videos have been watched.",
  //   duration: "Session",
  //   category: "analytics",
  // },
  // {
  //   name: "PREF",
  //   provider: "YouTube",
  //   purpose: "Stores YouTube player preferences.",
  //   duration: "8 months",
  //   category: "analytics",
  // },

  // Google Maps
  // {
  //   name: "NID",
  //   provider: "Google Maps",
  //   purpose: "Stores user preferences and other information for maps.",
  //   duration: "6 months",
  //   category: "analytics",
  // },
  // {
  //   name: "OGPC",
  //   provider: "Google Maps",
  //   purpose: "Stores information about whether you have already agreed to the terms of use.",
  //   duration: "2 months",
  //   category: "essential",
  // },

  // Google Ads / AdWords
  // {
  //   name: "IDE",
  //   provider: "Google DoubleClick",
  //   purpose: "Used for remarketing campaigns.",
  //   duration: "13 months",
  //   category: "marketing",
  // },
  // {
  //   name: "test_cookie",
  //   provider: "Google DoubleClick",
  //   purpose: "Tests whether the browser supports cookies.",
  //   duration: "15 minutes",
  //   category: "marketing",
  // },
  // {
  //   name: "_gcl_*",
  //   provider: "Google Ads",
  //   purpose: "Tracks conversions from Google Ads.",
  //   duration: "90 days",
  //   category: "marketing",
  // },
];

// Czeech version of the same cookies
// export const cookies: Cookie[] = [
//   // Essential Cookies
//   {
//     name: "CONSENT",
//     provider: "Google",
//     purpose: "Ukládá preference souhlasu uživatele s cookies.",
//     duration: "2 roky",
//     category: "essential",
//   },
//   {
//     name: "cookieConsent",
//     provider: "Vlastní",
//     purpose: "Ukládá vaše preference ohledně souborů cookie.",
//     duration: "1 rok",
//     category: "essential",
//   },
//   {
//     name: "PHPSESSID / JSESSIONID",
//     provider: "Vlastní",
//     purpose: "Identifikuje relaci uživatele na serveru.",
//     duration: "Relace",
//     category: "essential",
//   },

//   // Google Analytics Cookies
//   {
//     name: "_ga",
//     provider: "Google Analytics",
//     purpose: "Používá se k rozlišení uživatelů pro statistické účely.",
//     duration: "2 roky",
//     category: "analytics",
//   },
//   {
//     name: "_ga_*",
//     provider: "Google Analytics",
//     purpose: "Používá se ke sledování stavu relace pro Google Analytics 4.",
//     duration: "2 roky",
//     category: "analytics",
//   },
//   {
//     name: "_gid",
//     provider: "Google Analytics",
//     purpose: "Používá se k rozlišení uživatelů.",
//     duration: "24 hodin",
//     category: "analytics",
//   },
//   {
//     name: "_gat",
//     provider: "Google Analytics",
//     purpose: "Používá se k omezení rychlosti požadavků.",
//     duration: "1 minuta",
//     category: "analytics",
//   },

//   // Google Tag Manager
//   {
//     name: "_gcl_au",
//     provider: "Google Tag Manager",
//     purpose: "Používá Google AdSense pro experimentování s efektivitou reklam.",
//     duration: "3 měsíce",
//     category: "marketing",
//   },
//   {
//     name: "_gac_*",
//     provider: "Google Ads",
//     purpose: "Obsahuje informace o kampaních pro daného uživatele.",
//     duration: "90 dní",
//     category: "marketing",
//   },

//   // Meta/Facebook Pixel
//   {
//     name: "_fbp",
//     provider: "Facebook",
//     purpose: "Používá se k doručování cílené reklamy a měření výkonu reklam.",
//     duration: "3 měsíce",
//     category: "marketing",
//   },
//   {
//     name: "_fbc",
//     provider: "Facebook",
//     purpose: "Ukládá informace o poslední návštěvě z Facebook reklamy.",
//     duration: "2 roky",
//     category: "marketing",
//   },
//   {
//     name: "fr",
//     provider: "Facebook",
//     purpose: "Používá se k zobrazování relevantní reklamy.",
//     duration: "3 měsíce",
//     category: "marketing",
//   },

//   // YouTube Embeds
//   {
//     name: "VISITOR_INFO1_LIVE",
//     provider: "YouTube",
//     purpose: "Pokouší se odhadnout šířku pásma uživatele při přehrávání videí.",
//     duration: "6 měsíců",
//     category: "analytics",
//   },
//   {
//     name: "YSC",
//     provider: "YouTube",
//     purpose: "Zaznamenává jedinečné ID pro statistiky zobrazených videí.",
//     duration: "Relace",
//     category: "analytics",
//   },
//   {
//     name: "PREF",
//     provider: "YouTube",
//     purpose: "Ukládá preference přehrávače YouTube.",
//     duration: "8 měsíců",
//     category: "analytics",
//   },

//   // Google Maps
//   {
//     name: "NID",
//     provider: "Google Maps",
//     purpose: "Ukládá preference uživatele a další informace pro mapy.",
//     duration: "6 měsíců",
//     category: "analytics",
//   },
//   {
//     name: "OGPC",
//     provider: "Google Maps",
//     purpose: "Uchovává informace o tom, zda jste již souhlasili s podmínkami používání.",
//     duration: "2 měsíce",
//     category: "essential",
//   },

//   // Google Ads / AdWords
//   {
//     name: "IDE",
//     provider: "Google DoubleClick",
//     purpose: "Používá se pro remarketingové kampaně.",
//     duration: "13 měsíců",
//     category: "marketing",
//   },
//   {
//     name: "test_cookie",
//     provider: "Google DoubleClick",
//     purpose: "Testuje, zda prohlížeč podporuje cookies.",
//     duration: "15 minut",
//     category: "marketing",
//   },
//   {
//     name: "_gcl_*",
//     provider: "Google Ads",
//     purpose: "Sleduje konverze z Google Ads.",
//     duration: "90 dní",
//     category: "marketing",
//   },
// ];
