import { getPublicAppUrl } from "@/config/public-env";

type AppAuthor = {
  name: string;
  url: string;
};

export const app = {
  // Adopted products should replace every value in this block before launch.
  site: {
    name: "Start App",
    defaultTitle: "Start App",
    defaultDescription:
      "A production-ready white-label application with authentication, account management, organizations, and deployment foundations.",
    domain: "example.com",
    url: getPublicAppUrl(),
  },
  metadata: {
    authors: [
      {
        name: "Example Company",
        url: "https://www.example.com",
      },
    ] as AppAuthor[],
  },
};
