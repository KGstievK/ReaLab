import type { Metadata } from "next";
import ProductReaLabPage from "../../../appPages/site/components/pages/ProductReaLabPage";
import {
  buildProductBreadcrumbStructuredData,
  buildProductMetadata,
  buildProductStructuredData,
  getProductSeoData,
  resolveProductIdParam,
} from "@/utils/productSeo";
import { notFound } from "next/navigation";

type ProductPageProps = {
  params: Promise<{
    single: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: ProductPageProps): Promise<Metadata> => {
  const { single } = await params;
  const productId = resolveProductIdParam(single);

  if (!productId) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const product = await getProductSeoData(productId);
  return buildProductMetadata(productId, product);
};

const ProductPage = async ({ params }: ProductPageProps) => {
  const { single } = await params;
  const productId = resolveProductIdParam(single);

  if (!productId) {
    notFound();
  }

  const product = await getProductSeoData(productId);
  const structuredData = product
    ? [
        buildProductStructuredData(product),
        buildProductBreadcrumbStructuredData(product),
      ]
    : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      ) : null}
      <ProductReaLabPage productId={productId} />
    </>
  );
};

export default ProductPage;
