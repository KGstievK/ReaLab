import { api as index } from "..";

const api = index.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<AUTH.GetResponse, AUTH.GetRequest>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const profileWithSlash = await fetchWithBQ({
          url: "/profile/",
          method: "GET",
        });

        if (!profileWithSlash.error) {
          const data = profileWithSlash.data as AUTH.GetResponse | AUTH.GetResponse[number];
          return {
            data: Array.isArray(data) ? data : [data],
          };
        }

        const profileWithoutSlash = await fetchWithBQ({
          url: "/profile",
          method: "GET",
        });

        if (!profileWithoutSlash.error) {
          const data = profileWithoutSlash.data as AUTH.GetResponse | AUTH.GetResponse[number];
          return {
            data: Array.isArray(data) ? data : [data],
          };
        }

        const fallbackError = profileWithSlash.error ?? profileWithoutSlash.error ?? {
          status: "CUSTOM_ERROR" as const,
          error: "Unable to fetch profile",
        };
        return { error: fallbackError };
      },
      providesTags: ["auth"],
    }),
    postLogin: build.mutation<AUTH.PostLoginResponse, AUTH.PostLoginRequest>({
      query: (data) => ({
        url: "/login/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
    postRegistration: build.mutation<
      AUTH.PostRegistrationResponse,
      AUTH.PostRegistrationRequest
    >({
      query: (data) => ({
        url: "/register/",
        method: "POST",
        body: data,

      }),
      invalidatesTags: ["auth"],
    }),
    postLogout: build.mutation<AUTH.PostLogoutResponse, AUTH.PostLogoutRequest>(
      {
        query: () => ({
          url: "/logout/",
          method: "POST",
        }),
        invalidatesTags: ["auth"],
      }
    ),
    putMe: build.mutation<AUTH.PutMeResponse, AUTH.PutMeRequest>({
      query: ({ id, ...data }) => ({
        url: `/profile/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
    patchRefreshToken: build.mutation<
      AUTH.PatchRefreshResponse,
      AUTH.PatchRefreshRequest
    >({
      query: (data) => ({
        url: "/api/token/refresh/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
    postPasswordReset: build.mutation<
      AUTH.PostForgotPasswordResponse,
      AUTH.PostForgotPasswordRequest
    >({
      query: (data) => ({
        url: "/password_reset/",
        method: "POST",
        body: data,
      }),
    }),
    postForgotPassword: build.mutation<
    AUTH.PostForgotPasswordResponse,
    AUTH.PostForgotPasswordRequest
  >({
    query: (data) => ({
      url: "/password_reset/",
      method: "POST",
      body: data,
    }),
    invalidatesTags: ["auth"],
  }),
  postResetPassword: build.mutation<
    AUTH.PostResetPasswordResponse,
    AUTH.PostResetPasswordRequest
  >({
    query: (data) => ({
      url: "/password_reset/verify_code/",
      method: "POST",
      body: data,
    }),
    invalidatesTags: ["auth"],
    }),
  }),
});

export const {
  useGetMeQuery,
  usePutMeMutation,
  usePostLoginMutation,
  usePostRegistrationMutation,
  usePostLogoutMutation,
  usePatchRefreshTokenMutation,

  usePostPasswordResetMutation,
  usePostForgotPasswordMutation,
  usePostResetPasswordMutation,
} = api;
