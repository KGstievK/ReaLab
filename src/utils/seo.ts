import type { Metadata } from "next";

const normalizeSiteUrl = (value?: string | null) => {
  const fallback = "http://localhost:3000";
  const raw = value?.trim() || fallback;

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  return `https://${raw.replace(/\/+$/, "")}`;
};

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL,
);

export const buildAbsoluteUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};

type CreatePageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  canonicalPath?: string;
  index?: boolean;
};

export const createPageMetadata = ({
  title,
  description,
  path = "/",
  canonicalPath,
  index = true,
}: CreatePageMetadataOptions): Metadata => {
  const canonical = canonicalPath || path;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: index
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title,
      description,
      url: buildAbsoluteUrl(canonical),
      siteName: "Jumana",
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
};

export const createNoIndexMetadata = (
  title: string,
  description: string,
  path?: string,
): Metadata =>
  createPageMetadata({
    title,
    description,
    path,
    index: false,
  });

