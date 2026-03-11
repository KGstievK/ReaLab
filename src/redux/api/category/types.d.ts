namespace ICATEGORY {
  type getAllClothesRes = AllClothes[];
  type getAllClothesReq =
    | {
        page?: number;
        page_size?: number;
        limit?: number;
        search?: string;
        category?: string;
        size?: string;
        color?: string;
        section?: "new" | "popular" | "sale";
        min_price?: number;
        max_price?: number;
        exclude_id?: number;
      }
    | void;

  type getClothesByIdRes = SingleProductData;
  type getClothesByIdReq = number;

  type getCategoryRes = Array<
    category & {
      count?: number;
    }
  >;
  type getCategoryReq = void;

  type postToFavoreRes = GetFavorites;

  type postToFavoreReq = PostToFavoriteReq;

  type getToFavoreRes = GetFavorites[];
  type getToFavoreReq = void;

  type deleteFavoreRes = {
    success: boolean;
    id: number;
  };
  type deleteFavoreReq = number;

  type getFirstSectionRes = firstSection[];
  type getFirstSectionReq = void;

  type getContactInfoRes = GetContactInfo[];
  type getContactInfoReq = void;

  type getSaleInfoRes = SaleContent[];
  type getSaleInfoReq = void;

  type getEndContentRes = {
    title: string;
    text: string;
  }[];
  type getEndContentReq = void;
}
