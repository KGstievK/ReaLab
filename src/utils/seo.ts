import type { Metadata } from "next";

export const SITE_NAME = "ReaLab";
export const SITE_DESCRIPTION =
  "ReaLab — storefront медицинского оборудования для клиник, лабораторий и реабилитационных центров.";

const normalizeSiteUrl = (value?: string | null) => {
  const fallback = "http://localhost:3000";
  const raw = value?.trim() || fallback;

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  return `https://${raw.replace(/\/+$/, "")}`;
};

const normalizeApiBaseUrl = (value?: string | null) => {
  const raw = value?.trim() || "";
  if (!raw) {
    return null;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  return `https://${raw.replace(/\/+$/, "")}`;
};

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL,
);

const API_BASE_URL = normalizeApiBaseUrl(
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL,
);

export const getApiBaseUrl = () => API_BASE_URL;

export const buildAbsoluteUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};

export const buildPathWithQuery = (
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!query) {
    return normalizedPath;
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue) {
      return;
    }

    params.set(key, normalizedValue);
  });

  const queryString = params.toString();
  return queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
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
      siteName: SITE_NAME,
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
