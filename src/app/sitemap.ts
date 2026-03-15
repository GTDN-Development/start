import { MetadataRoute } from "next";
import { app } from "@/config/app";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = app.site.url;
  const currentDate = new Date();

  // Main pages that should always be included
  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
