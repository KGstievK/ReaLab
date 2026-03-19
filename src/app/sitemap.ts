import type { MetadataRoute } from "next";
import { buildAbsoluteUrl, buildPathWithQuery, getApiBaseUrl } from "@/utils/seo";

const now = new Date();
const SITEMAP_REVALIDATE_SECONDS = 300;

type SitemapProduct = {
  id: number;
  created_date?: string;
};

type SitemapCategory = {
  category_name: string;
};

const fetchJson = async <T,>(path: string): Promise<T | null> => {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
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

  const [products, categories] = await Promise.all([
    fetchJson<SitemapProduct[]>("/?limit=500"),
    fetchJson<SitemapCategory[]>("/category/"),
  ]);

  const productRoutes: MetadataRoute.Sitemap = (products ?? [])
    .filter((item) => Number.isFinite(item.id) && item.id > 0)
    .map((item) => ({
      url: buildAbsoluteUrl(`/${item.id}`),
      lastModified: item.created_date ? new Date(item.created_date) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const categoryRoutes: MetadataRoute.Sitemap = Array.from(
    new Set(
      (categories ?? [])
        .map((item) => item.category_name?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).map((categoryName) => ({
    url: buildAbsoluteUrl(
      buildPathWithQuery("/catalog", {
        category: categoryName,
      }),
    ),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.76,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
