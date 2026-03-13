import { notFound, redirect } from "next/navigation";
import { extractProductIdFromSlug } from "@/utils/productRoute";

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
