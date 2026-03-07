import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import {
  clearAuthTokens,
  getStoredAccessToken,
  getStoredAuthBundle,
  saveAuthTokens,
} from "../../utils/authStorage";

const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}`,
  prepareHeaders: (headers) => {
    const token = getStoredAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

let refreshRequestPromise: Promise<boolean> | null = null;

const baseQueryExtended: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  const requestUrl = typeof args === "string" ? args : (args as FetchArgs).url;
  const isRefreshRequest = requestUrl.includes("/api/token/refresh");

  if (result.error && !isRefreshRequest) {
    const error = result.error as FetchBaseQueryError;
    if (error.status === 401) {
      if (!refreshRequestPromise) {
        refreshRequestPromise = (async () => {
          const { tokens, rememberMe } = getStoredAuthBundle();
          const refresh = tokens?.refresh;

          if (!refresh) {
            clearAuthTokens();
            return false;
          }

          const refreshResult = await baseQuery(
            {
              url: "/api/token/refresh/",
              method: "POST",
              body: { refresh },
            },
            api,
            extraOptions,
          );

          if (!refreshResult.data) {
            clearAuthTokens();
            return false;
          }

          const refreshed = refreshResult.data as {
            access?: string;
            refresh?: string;
          };

          if (!refreshed.access) {
            clearAuthTokens();
            return false;
          }

          saveAuthTokens(
            {
              access: refreshed.access,
              refresh: refreshed.refresh || refresh,
            },
            rememberMe,
          );
          return true;
        })().finally(() => {
          refreshRequestPromise = null;
        });
      }

      const refreshed = await refreshRequestPromise;
      if (refreshed) {
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryExtended,
  refetchOnReconnect: true,
  refetchOnFocus: false,
  tagTypes: ["auth", "product", "slider", "category", "review", "admin"],
  endpoints: () => ({}),
});
