import { api as index } from "..";

const api = index.injectEndpoints({
  endpoints: (build) => ({
    searchCatalog: build.query<
      ISEARCH.searchCatalogRes,
      ISEARCH.searchCatalogReq
    >({
      query: (params) => ({
        url: "/search/",
        method: "GET",
        params,
      }),
      keepUnusedDataFor: 15,
      providesTags: ["category"],
    }),
  }),
});

export const { useSearchCatalogQuery } = api;
