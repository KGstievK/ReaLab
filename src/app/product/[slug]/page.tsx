import { createNoIndexMetadata } from "@/utils/seo";
import { notFound, redirect } from "next/navigation";
import { extractProductIdFromSlug } from "@/utils/productRoute";

export const metadata = createNoIndexMetadata(
  "Перенаправление товара",
  "Технический alias-маршрут карточки товара Jumana.",
  "/product",
);

type ProductAliasPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const ProductAliasPage = async ({ params }: ProductAliasPageProps) => {
  const { slug } = await params;
  const productId = extractProductIdFromSlug(slug);

  if (!productId) {
    notFound();
  }

  redirect(`/${productId}`);
};

export default ProductAliasPage;
