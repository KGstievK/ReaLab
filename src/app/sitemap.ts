import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "@/utils/seo";

const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: buildAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: buildAbsoluteUrl("/catalog"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: buildAbsoluteUrl("/new"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: buildAbsoluteUrl("/popular"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: buildAbsoluteUrl("/sale"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: buildAbsoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl("/contacts"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}

