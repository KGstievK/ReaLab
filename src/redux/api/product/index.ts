import { api as index } from "..";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateCartTotal = (items: cart[]) =>
  String(
    items.reduce((sum, item) => sum + toNumber(item.total_price), 0),
  );

const patchCartItemQuantity = (item: cart, quantity: number) => {
  item.quantity = quantity;
  item.total_price = String(toNumber(item.just_price) * quantity);
};

const updateProductQueryData = index.util.updateQueryData as any;

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
      keepUnusedDataFor: 60,
      providesTags: ["product"],
    }),
    getBasket: build.query<PRODUCT.getBasketRes, PRODUCT.getBasketReq>({
      query: () => ({
        url: `/cart_item/check/`,
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: ["product"],
    }),
    getCartItem: build.query<PRODUCT.getCartItemRes, PRODUCT.getCartItemReq>({
      query: (id) => ({
        url: `/cart_item/${id}/`,
        method: "GET",
      }),
      providesTags: ["product"],
    }),
    addToBasket: build.mutation<PRODUCT.addToBasketRes, PRODUCT.addToBasketReq>(
      {
        query: (data) => ({
          url: `/cart_item/create/`,
          method: "POST",
          body: data,
        }),
        async onQueryStarted(data, { dispatch, queryFulfilled }) {
          const tempId = -Date.now();
          const patchBasket = dispatch(
            updateProductQueryData("getBasket", undefined, (draft: cart[]) => {
              if (!Array.isArray(draft)) return;

              const existing = draft.find(
                (item) =>
                  item.clothes_id === data.clothes_id &&
                  item.size === data.size &&
                  item.color_id === data.color_id,
              );
              if (existing) {
                patchCartItemQuantity(existing, existing.quantity + data.quantity);
                return;
              }

              draft.push({
                id: tempId,
                clothes: {
                  clothes_name: data.clothes.clothes_name || "",
                  clothes_img: [],
                },
                clothes_id: data.clothes_id,
                quantity: data.quantity,
                size: data.size,
                color: data.color_id,
                color_id: data.color_id,
                just_price: "0",
                price_clothes: "0",
                total_price: "0",
              });
            }),
          );

          const patchCart = dispatch(
            updateProductQueryData("getCart", undefined, (draft: AllCart) => {
              if (!draft || !Array.isArray(draft.cart_items)) return;

              const existing = draft.cart_items.find(
                (item) =>
                  item.clothes_id === data.clothes_id &&
                  item.size === data.size &&
                  item.color_id === data.color_id,
              );
              if (existing) {
                patchCartItemQuantity(existing, existing.quantity + data.quantity);
              } else {
                draft.cart_items.push({
                  id: tempId,
                  clothes: {
                    clothes_name: data.clothes.clothes_name || "",
                    clothes_img: [],
                  },
                  clothes_id: data.clothes_id,
                  quantity: data.quantity,
                  size: data.size,
                  color: data.color_id,
                  color_id: data.color_id,
                  just_price: "0",
                  price_clothes: "0",
                  total_price: "0",
                });
              }

              draft.total_price = calculateCartTotal(draft.cart_items);
            }),
          );

          try {
            await queryFulfilled;
          } catch {
            patchBasket.undo();
            patchCart.undo();
          }
        },
        invalidatesTags: ["product"],
      }
    ),
    updateBasket: build.mutation<PRODUCT.editBasketRes, PRODUCT.editBasketReq>({
      query: ({ id, updateBasket }) => ({
        url: `/cart_item/${id}/`,
        method: "PATCH",
        body: updateBasket,
      }),
      async onQueryStarted({ id, updateBasket }, { dispatch, queryFulfilled }) {
        const patchBasket = dispatch(
          updateProductQueryData("getBasket", undefined, (draft: cart[]) => {
            if (!Array.isArray(draft) || !id) return;

            const item = draft.find((entry) => entry.id === id);
            if (item) {
              patchCartItemQuantity(item, updateBasket.quantity);
            }
          }),
        );

        const patchCart = dispatch(
          updateProductQueryData("getCart", undefined, (draft: AllCart) => {
            if (!draft || !Array.isArray(draft.cart_items) || !id) return;

            const item = draft.cart_items.find((entry) => entry.id === id);
            if (item) {
              patchCartItemQuantity(item, updateBasket.quantity);
              draft.total_price = calculateCartTotal(draft.cart_items);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchBasket.undo();
          patchCart.undo();
        }
      },
    }),
    deleteBasket: build.mutation<
      PRODUCT.deleteBasketRes,
      PRODUCT.deleteBasketReq
    >({
      query: (id) => ({
        url: `/cart_item/${id}/`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchBasket = dispatch(
          updateProductQueryData("getBasket", undefined, (draft: cart[]) => {
            if (!Array.isArray(draft)) return;

            const indexToRemove = draft.findIndex((item) => item.id === id);
            if (indexToRemove >= 0) {
              draft.splice(indexToRemove, 1);
            }
          }),
        );

        const patchCart = dispatch(
          updateProductQueryData("getCart", undefined, (draft: AllCart) => {
            if (!draft || !Array.isArray(draft.cart_items)) return;

            const indexToRemove = draft.cart_items.findIndex((item) => item.id === id);
            if (indexToRemove >= 0) {
              draft.cart_items.splice(indexToRemove, 1);
              draft.total_price = calculateCartTotal(draft.cart_items);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchBasket.undo();
          patchCart.undo();
        }
      },
    }),

    getAboutUs: build.query<PRODUCT.getAboutRes, PRODUCT.getAboutReq>({
      query: () => ({
        url: `/about_me`,
        method: `GET`,
      }),
      keepUnusedDataFor: 300,
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
      providesTags: ["product"],
    }),
    getPay: build.query<PRODUCT.getPayRes, PRODUCT.getPayReq>({
      query: () => ({
        url: `/pay/`,
        method: `GET`,
      }),
      keepUnusedDataFor: 300,
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
