export const extractProductIdFromSlug = (slug: string): number | null => {
  if (!slug) return null;

  if (/^\d+$/.test(slug)) {
    const parsed = Number(slug);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const match = slug.match(/-(\d+)$/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const slugifyProductSegment = (value?: string | null): string =>
  (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");

export const buildProductHref = (product: {
  id: number;
  slug?: string | null;
  clothes_name?: string | null;
  clothesName?: string | null;
}): string => {
  if (!Number.isFinite(product.id) || product.id <= 0) {
    return "/";
  }

  const baseSlug =
    (product.slug || "").trim() ||
    slugifyProductSegment(product.clothes_name || product.clothesName);

  return baseSlug ? `/product/${baseSlug}-${product.id}` : `/product/${product.id}`;
};
