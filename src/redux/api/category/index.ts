import { api as index } from "..";

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
    }),
    getAllCategory: build.query<
      ICATEGORY.getCategoryRes,
      ICATEGORY.getCategoryReq
    >({
      query: () => ({
        url: "/category/",
        method: "GET",
      }),
      providesTags: ["category"],
    }),

    getAllClothes: build.query<
      ICATEGORY.getAllClothesRes,
      ICATEGORY.getAllClothesReq
    >({
      query: () => ({
        url: "/",
        method: "GET",
      }),
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
      invalidatesTags: ["category"],
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
      invalidatesTags: ["category"],
    }),
  }),
});

export const {
  useGetAllCategoryQuery,
  useGetAllClothesQuery,
  useGetClothesByIdQuery,
  usePostToFavoriteMutation,
  useGetToFavoriteQuery,
  useDeleteFavoriteMutation,
  useGetFirstSectionQuery,
  useGetContactInfoQuery,
  useGetSaleContentQuery,
  useGetEndContentQuery,
} = api;
