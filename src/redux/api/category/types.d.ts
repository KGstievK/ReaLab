namespace ICATEGORY {
  type getAllClothesRes = AllClothes[];
  type getAllClothesReq = void;

  type getClothesByIdRes = SingleProductData;
  type getClothesByIdReq = number;

  type getCategoryRes = category[];
  type getCategoryReq = void;

  type postToFavoreRes = PostToFavoriteRes[];

  type postToFavoreReq = PostToFavoriteReq;

  type getToFavoreRes = GetFavorites[];
  type getToFavoreReq = void;

  type deleteFavoreRes = GetFavorites[];
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
