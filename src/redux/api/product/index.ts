import { api as index } from "..";

const api = index.injectEndpoints({
  endpoints: (build) => ({
    getProduct: build.query({
      query: () => ({
        url: "/",
        method: "GET",
      }),
      providesTags: ["product"],
    }),
    postProduct: build.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["product"],
    }),
    patchProduct: build.mutation({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["product"],
    }),
    deleteProduct: build.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["product"],
    }),
    getCart: build.query<PRODUCT.getAllCartRes, PRODUCT.getAllCartReq>({
      query: () => ({
        url: `/cart/`,
        method: "GET",
      }),
    }),
    getBasket: build.query<PRODUCT.getBasketRes, PRODUCT.getBasketReq>({
      query: () => ({
        url: `/cart_item/check/`,
        method: "GET",
      }),
    }),
    getCartItem: build.query<PRODUCT.getCartItemRes, PRODUCT.getCartItemReq>({
      query: (id) => ({
        url: `/cart_item/${id}/`,
        method: "GET",
      }),
    }),
    addToBasket: build.mutation<PRODUCT.addToBasketRes, PRODUCT.addToBasketReq>(
      {
        query: (data) => ({
          url: `/cart_item/create/`,
          method: "POST",
          body: data,
        }),
        invalidatesTags: ["product"],
      }
    ),
    updateBasket: build.mutation<PRODUCT.editBasketRes, PRODUCT.editBasketReq>({
      query: ({ id, updateBasket }) => ({
        url: `/cart_item/${id}/`,
        method: "PATCH",
        body: updateBasket,
      }),
      invalidatesTags: ["product"],
    }),
    deleteBasket: build.mutation<
      PRODUCT.deleteBasketRes,
      PRODUCT.deleteBasketReq
    >({
      query: (id) => ({
        url: `/cart_item/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["product"],
    }),

    getAboutUs: build.query<PRODUCT.getAboutRes, PRODUCT.getAboutReq>({
      query: () => ({
        url: `/about_me`,
        method: `GET`,
      }),
    }),
    postOrder: build.mutation<PRODUCT.postOrderRes, PRODUCT.postOrderReq>({
      query: (data) => ({
        url: `/order/create/`,
        method: `POST`,
        body: data,
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      }),
    }),

    getOrder: build.query<PRODUCT.getOrderRes, PRODUCT.getOrderReq>({
      query: () => ({
        url: `/order/check/`,
        method: `GET`,
      }),
    }),
    getPay: build.query<PRODUCT.getPayRes, PRODUCT.getPayReq>({
      query: () => ({
        url: `/pay/`,
        method: `GET`,
      }),
    }),
  }),
});

export const {
  useGetProductQuery,
  usePostProductMutation,
  usePatchProductMutation,
  useDeleteProductMutation,
  useGetBasketQuery,
  useAddToBasketMutation,
  useGetCartItemQuery,
  useDeleteBasketMutation,
  useUpdateBasketMutation,
  useGetCartQuery,
  useGetAboutUsQuery,
  usePostOrderMutation,
  useGetOrderQuery,
  useGetPayQuery
} = api;
