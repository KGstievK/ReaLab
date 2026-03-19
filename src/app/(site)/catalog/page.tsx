import type { Metadata } from "next";
import { Suspense } from "react";
import CatalogReaLabPage from "../../../appPages/site/components/pages/CatalogReaLabPage";
import {
  buildPathWithQuery,
  createNoIndexMetadata,
  createPageMetadata,
} from "@/utils/seo";

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const INDEXABLE_QUERY_KEYS = new Set(["category", "page"]);
const FACETED_QUERY_KEYS = new Set([
  "size",
  "color",
  "min_price",
  "max_price",
  "in_stock",
  "season",
  "collection",
  "sale",
  "new",
  "sort",
  "search",
]);

const readString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const hasMeaningfulValue = (value: string | string[] | undefined) =>
  Boolean(readString(value)?.trim());

export const generateMetadata = async ({
  searchParams,
}: CatalogPageProps): Promise<Metadata> => {
  const params = await searchParams;
  const category = readString(params.category)?.trim();
  const page = readString(params.page)?.trim();

  const hasUnsupportedFilters = Object.entries(params).some(
    ([key, value]) => !INDEXABLE_QUERY_KEYS.has(key) && hasMeaningfulValue(value),
  );
  const hasFacetedFilters =
    hasUnsupportedFilters || Object.keys(params).some((key) => FACETED_QUERY_KEYS.has(key));

  if (hasFacetedFilters) {
    return createNoIndexMetadata(
      "Каталог ReaLab",
      "Каталог медицинского оборудования ReaLab.",
      "/catalog",
    );
  }

  const normalizedPage = page && page !== "1" ? page : undefined;

  if (category) {
    const canonicalPath = buildPathWithQuery("/catalog", {
      category,
      page: normalizedPage,
    });
    const pageSuffix = normalizedPage ? `, страница ${normalizedPage}` : "";

    return createPageMetadata({
      title: `${category} — каталог ReaLab${pageSuffix}`,
      description: `Каталог ReaLab: ${category.toLowerCase()}, медицинское оборудование и конфигурации для клиник.${pageSuffix}`,
      path: canonicalPath,
      canonicalPath,
    });
  }

  const canonicalPath = buildPathWithQuery("/catalog", {
    page: normalizedPage,
  });
  const pageSuffix = normalizedPage ? ` — страница ${normalizedPage}` : "";

  return createPageMetadata({
    title: `Каталог ReaLab${pageSuffix}`,
    description:
      "Каталог ReaLab: мониторинг пациентов, визуальная диагностика, инфузионная терапия, лабораторные и реабилитационные системы.",
    path: canonicalPath,
    canonicalPath,
  });
};

const page = () => {
  return (
    <Suspense fallback={<div />}>
      <CatalogReaLabPage />
    </Suspense>
  );
};

export default page;
