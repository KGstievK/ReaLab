import { createNoIndexMetadata } from "@/utils/seo";
import { notFound, redirect } from "next/navigation";
import { extractProductIdFromSlug } from "@/utils/productRoute";

export const metadata = createNoIndexMetadata(
  "Технический маршрут товара",
  "Технический alias-маршрут карточки товара ReaLab.",
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
