import "server-only";

import type { Metadata } from "next";
import { cache } from "react";
import { resolveMediaUrl } from "./media";
import {
  SITE_NAME,
  buildAbsoluteUrl,
  createNoIndexMetadata,
  getApiBaseUrl,
} from "./seo";

const PRODUCT_REVALIDATE_SECONDS = 300;

const normalizeWhitespace = (value?: string | null) =>
  (value || "").replace(/\s+/g, " ").trim();

const truncateText = (value: string, maxLength = 170) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
};

const parseProductId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getProductPath = (productId: number) => `/${productId}`;

const getProductCategoryName = (product: SingleProductData) =>
  product.category?.[0]?.category_name?.trim() || "";

const getProductMaterial = (product: SingleProductData) =>
  product.textile_clothes
    ?.map((item) => normalizeWhitespace(item.textile_name))
    .filter(Boolean)
    .join(", ") || "";

const getProductColors = (product: SingleProductData) =>
  Array.from(
    new Set(
      (product.clothes_img || [])
        .map((item) => normalizeWhitespace(item.color))
        .filter(Boolean),
    ),
  );

const getCurrentProductPrice = (product: SingleProductData) => {
  const discountPrice = Number(product.discount_price);
  const price = Number(product.price);

  if (Number.isFinite(discountPrice) && discountPrice > 0) {
    return discountPrice;
  }

  return Number.isFinite(price) ? price : 0;
};

const toAbsoluteProductImageUrl = (value?: string | null) => {
  const resolved = resolveMediaUrl(value);
  if (!resolved) {
    return null;
  }

  if (/^https?:\/\//i.test(resolved)) {
    return resolved;
  }

  return buildAbsoluteUrl(resolved);
};

const buildProductDescription = (product: SingleProductData) => {
  const categoryName = getProductCategoryName(product);
  const material = getProductMaterial(product);
  const currentPrice = getCurrentProductPrice(product);
  const descriptionSource =
    normalizeWhitespace(product.clothes_description) ||
    [
      product.clothes_name,
      categoryName ? `Категория: ${categoryName}.` : "",
      material ? `Материалы и корпус: ${material}.` : "",
      currentPrice > 0 ? `Цена: ${currentPrice} KGS.` : "",
      "Медицинское оборудование ReaLab для клиник, лабораторий и реабилитационных центров.",
    ]
      .filter(Boolean)
      .join(" ");

  return truncateText(descriptionSource);
};

const getProductAvailability = (product: SingleProductData) =>
  product.active && product.quantities > 0
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

export const getProductSeoData = cache(async (productId: number) => {
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/${productId}/`, {
      next: { revalidate: PRODUCT_REVALIDATE_SECONDS },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SingleProductData;
  } catch {
    return null;
  }
});

export const buildProductMetadata = (
  productId: number,
  product: SingleProductData | null,
): Metadata => {
  const path = getProductPath(productId);

  if (!product) {
    return createNoIndexMetadata(
      `Карточка оборудования ${SITE_NAME}`,
      `Технический маршрут карточки товара ${SITE_NAME}.`,
      path,
    );
  }

  const categoryName = getProductCategoryName(product);
  const title = categoryName
    ? `${product.clothes_name} — ${categoryName} | ${SITE_NAME}`
    : `${product.clothes_name} | ${SITE_NAME}`;
  const description = buildProductDescription(product);
  const images = (product.clothes_img || [])
    .map((item) => toAbsoluteProductImageUrl(item.photo))
    .filter((value): value is string => Boolean(value))
    .slice(0, 4);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: product.active
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
      url: buildAbsoluteUrl(path),
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "website",
      ...(images.length
        ? {
            images: images.map((image) => ({
              url: image,
              alt: product.clothes_name,
            })),
          }
        : {}),
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      ...(images[0] ? { images: [images[0]] } : {}),
    },
  };
};

export const buildProductStructuredData = (product: SingleProductData) => {
  const categoryName = getProductCategoryName(product);
  const material = getProductMaterial(product);
  const colors = getProductColors(product);
  const currentPrice = getCurrentProductPrice(product);
  const reviewCount = product.clothes_review?.length || 0;
  const ratingValue = Number(product.average_rating);
  const absoluteImages = (product.clothes_img || [])
    .map((item) => toAbsoluteProductImageUrl(item.photo))
    .filter((value): value is string => Boolean(value));
  const path = getProductPath(product.id);

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.clothes_name,
    description: buildProductDescription(product),
    url: buildAbsoluteUrl(path),
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    itemCondition: "https://schema.org/NewCondition",
    availability: getProductAvailability(product),
    offers: {
      "@type": "Offer",
      priceCurrency: "KGS",
      price: currentPrice.toFixed(2),
      availability: getProductAvailability(product),
      url: buildAbsoluteUrl(path),
    },
  };

  if (absoluteImages.length) {
    structuredData.image = absoluteImages;
  }

  if (categoryName) {
    structuredData.category = categoryName;
  }

  if (material) {
    structuredData.material = material;
  }

  if (colors.length) {
    structuredData.color = colors.join(", ");
  }

  if (normalizeWhitespace(product.made_in)) {
    structuredData.countryOfOrigin = normalizeWhitespace(product.made_in);
  }

  if (Number.isFinite(ratingValue) && ratingValue > 0 && reviewCount > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(2),
      reviewCount,
    };
  }

  const reviews = (product.clothes_review || []).slice(0, 3).map((review) => ({
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.stars,
      bestRating: 5,
    },
    author: {
      "@type": "Person",
      name: normalizeWhitespace(
        `${review.author.first_name} ${review.author.last_name}`,
      ),
    },
    reviewBody: normalizeWhitespace(review.text),
    datePublished: review.created_date,
  }));

  if (reviews.length) {
    structuredData.review = reviews;
  }

  return structuredData;
};

export const buildProductBreadcrumbStructuredData = (
  product: SingleProductData,
) => {
  const categoryName = getProductCategoryName(product);
  const elements = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Главная",
      item: buildAbsoluteUrl("/"),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Каталог",
      item: buildAbsoluteUrl("/catalog"),
    },
  ] as Array<Record<string, unknown>>;

  if (categoryName) {
    elements.push({
      "@type": "ListItem",
      position: elements.length + 1,
      name: categoryName,
      item: buildAbsoluteUrl(`/catalog?category=${encodeURIComponent(categoryName)}`),
    });
  }

  elements.push({
    "@type": "ListItem",
    position: elements.length + 1,
    name: product.clothes_name,
    item: buildAbsoluteUrl(getProductPath(product.id)),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: elements,
  };
};

export const resolveProductIdParam = (value: string) => parseProductId(value);
