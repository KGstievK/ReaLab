import { api as index } from "..";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const updateCategoryQueryData = index.util.updateQueryData as any;

const api = index.injectEndpoints({
  endpoints: (build) => ({
    getFirstSection: build.query<
      ICATEGORY.getFirstSectionRes,
      ICATEGORY.getFirstSectionReq
    >({
      query: () => ({
        url: "/title/",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: ["category"],
    }),

    getContactInfo: build.query<
      ICATEGORY.getContactInfoRes,
      ICATEGORY.getContactInfoReq
    >({
      query: () => ({
        url: "/contact_info/",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: ["category"],
    }),

    getSaleContent: build.query<
      ICATEGORY.getSaleInfoRes,
      ICATEGORY.getSaleInfoReq
    >({
      query: () => ({
        url: "/sale/",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: ["category"],
    }),

    getEndContent: build.query<
      ICATEGORY.getEndContentRes,
      ICATEGORY.getEndContentReq
    >({
      query: () => ({
        url: "/end_title/",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
    }),
    getAllCategory: build.query<
      ICATEGORY.getCategoryRes,
      ICATEGORY.getCategoryReq
    >({
      query: () => ({
        url: "/category/",
        method: "GET",
      }),
      keepUnusedDataFor: 300,
      providesTags: ["category"],
    }),

    getAllClothes: build.query<
      ICATEGORY.getAllClothesRes,
      ICATEGORY.getAllClothesReq
    >({
      query: (params) => ({
        url: "/",
        method: "GET",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: ["category"],
    }),

    getCatalogFeed: build.query<
      ICATEGORY.getCatalogFeedRes,
      ICATEGORY.getCatalogFeedReq
    >({
      query: (params) => ({
        url: "/",
        method: "GET",
        params,
      }),
      keepUnusedDataFor: 30,
      providesTags: ["category"],
    }),

    getClothesById: build.query<
      ICATEGORY.getClothesByIdRes,
      ICATEGORY.getClothesByIdReq
    >({
      query: (id) => ({
        url: `/${id}/`,
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: ["category"],
    }),

    getToFavorite: build.query<
      ICATEGORY.getToFavoreRes,
      ICATEGORY.getToFavoreReq
    >({
      query: () => ({
        url: "/favorite_item/list/",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: ["category"],
    }),

    postToFavorite: build.mutation<
      ICATEGORY.postToFavoreRes,
      ICATEGORY.postToFavoreReq
    >({
      query: (data) => ({
        url: "/favorite_item/create/",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(data, { dispatch, queryFulfilled }) {
        const tempId = -Date.now();
        const patchResult = dispatch(
          updateCategoryQueryData("getToFavorite", undefined, (draft: GetFavorites[]) => {
            if (!Array.isArray(draft)) return;

            const exists = draft.some((item) => item.clothes.id === data.clothes_id);
            if (exists) {
              return;
            }

            draft.unshift({
              id: tempId,
              clothes: {
                id: data.clothes_id,
                promo_category: data.clothes.promo_category || [],
                clothes_name: data.clothes.clothes_name || "",
                price: toNumber(data.clothes.price),
                discount_price: String(toNumber(data.clothes.price)),
                size: data.clothes.size || "",
                average_rating: "0",
                created_date: new Date().toISOString(),
                clothes_img: [],
              },
              time: new Date().toISOString(),
            });
          }),
        );

        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            updateCategoryQueryData("getToFavorite", undefined, (draft: GetFavorites[]) => {
              if (!Array.isArray(draft)) return;

              const tempIndex = draft.findIndex((item) => item.id === tempId);
              if (tempIndex >= 0) {
                draft[tempIndex] = created as unknown as GetFavorites;
                return;
              }

              const createdFavorite = created as unknown as GetFavorites;
              const exists = draft.some((item) => item.clothes.id === createdFavorite.clothes.id);
              if (!exists) {
                draft.unshift(createdFavorite);
              }
            }),
          );
        } catch {
          patchResult.undo();
        }
      },
    }),

    deleteFavorite: build.mutation<
      ICATEGORY.deleteFavoreRes,
      ICATEGORY.deleteFavoreReq
    >({
      query: (id) => ({
        url: `/favorite_item/delete/${id}/`,
        method: "DELETE",
        body: id,
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          updateCategoryQueryData("getToFavorite", undefined, (draft: GetFavorites[]) => {
            if (!Array.isArray(draft)) return;

            const indexToRemove = draft.findIndex((item) => item.id === id);
            if (indexToRemove >= 0) {
              draft.splice(indexToRemove, 1);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetAllCategoryQuery,
  useGetAllClothesQuery,
  useGetCatalogFeedQuery,
  useGetClothesByIdQuery,
  usePostToFavoriteMutation,
  useGetToFavoriteQuery,
  useDeleteFavoriteMutation,
  useGetFirstSectionQuery,
  useGetContactInfoQuery,
  useGetSaleContentQuery,
  useGetEndContentQuery,
} = api;
