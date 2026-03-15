type AppAuthor = {
  name: string;
  url: string;
};

export const app = {
  site: {
    name: "Start",
    defaultTitle: "Production-Ready SaaS Starter Template",
    defaultDescription:
      "Fully featured SaaS template built with Next.js 16, TypeScript, shadcn/ui, and modern production-ready foundations.",
    domain: "gtdn.online",
    url: "https://www.gtdn.online",
  },
  metadata: {
    authors: [
      {
        name: "gtdn.online",
        url: "https://www.gtdn.online",
      },
    ] as AppAuthor[],
  },
};
