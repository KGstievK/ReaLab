namespace ISEARCH {
  type searchCatalogReq =
    | {
        q: string;
        limit?: number;
      }
    | void;

  type searchCatalogRes = {
    query: string;
    products: AllClothes[];
    categories: Array<{
      category_name: string;
      count: number;
    }>;
    collections: Array<{
      promo_category: string;
    }>;
  };
}
