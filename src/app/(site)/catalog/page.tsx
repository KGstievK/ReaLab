import type { Metadata } from "next";
import CatalogSection from "../../../appPages/site/components/pages/CatalogSections/CatalogSection";
import { createNoIndexMetadata, createPageMetadata } from "@/utils/seo";

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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
]);

const readString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const generateMetadata = async ({
  searchParams,
}: CatalogPageProps): Promise<Metadata> => {
  const params = await searchParams;
  const category = readString(params.category)?.trim();
  const page = readString(params.page)?.trim();
  const hasFacetedFilters = Object.keys(params).some((key) => FACETED_QUERY_KEYS.has(key));

  if (hasFacetedFilters) {
    return createNoIndexMetadata(
      "Каталог",
      "Каталог интернет-магазина Jumana.",
      "/catalog",
    );
  }

  if (category) {
    const suffix = page && page !== "1" ? `&page=${encodeURIComponent(page)}` : "";

    return createPageMetadata({
      title: `${category} — каталог`,
      description: `Каталог Jumana: ${category.toLowerCase()}, скромная женская одежда и modest fashion модели.`,
      path: `/catalog?category=${encodeURIComponent(category)}${suffix}`,
    });
  }

  return createPageMetadata({
    title: "Каталог",
    description:
      "Каталог Jumana: скромная женская одежда, платья, туники, комплекты, хиджабы и аксессуары.",
    path: "/catalog",
  });
};

const page = () => {
  return (
    <div>
      <CatalogSection />
    </div>
  );
};

export default page;
