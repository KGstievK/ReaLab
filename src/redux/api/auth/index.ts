import { api as index } from "..";

const api = index.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<AUTH.GetResponse, AUTH.GetRequest>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const profile = await fetchWithBQ({
          url: "/profile/",
          method: "GET",
        });

        if (!profile.error) {
          const data = profile.data as AUTH.GetResponse | AUTH.GetResponse[number];
          return {
            data: Array.isArray(data) ? data : [data],
          };
        }

        const fallbackError = profile.error ?? {
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
    getProfileAddresses: build.query<
      AUTH.GetProfileAddressesResponse,
      AUTH.GetProfileAddressesRequest
    >({
      query: () => ({
        url: "/profile/addresses/",
        method: "GET",
      }),
      providesTags: ["auth"],
    }),
    postProfileAddress: build.mutation<
      AUTH.PostProfileAddressResponse,
      AUTH.PostProfileAddressRequest
    >({
      query: (data) => ({
        url: "/profile/addresses/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
    patchProfileAddress: build.mutation<
      AUTH.PatchProfileAddressResponse,
      AUTH.PatchProfileAddressRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/profile/addresses/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
    deleteProfileAddress: build.mutation<
      AUTH.DeleteProfileAddressResponse,
      AUTH.DeleteProfileAddressRequest
    >({
      query: ({ id }) => ({
        url: `/profile/addresses/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["auth"],
    }),
    setDefaultProfileAddress: build.mutation<
      AUTH.SetDefaultProfileAddressResponse,
      AUTH.SetDefaultProfileAddressRequest
    >({
      query: ({ id }) => ({
        url: `/profile/addresses/${id}/default/`,
        method: "PATCH",
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
  useGetProfileAddressesQuery,
  usePutMeMutation,
  usePostProfileAddressMutation,
  usePatchProfileAddressMutation,
  useDeleteProfileAddressMutation,
  useSetDefaultProfileAddressMutation,
  usePostLoginMutation,
  usePostRegistrationMutation,
  usePostLogoutMutation,
  usePatchRefreshTokenMutation,

  usePostPasswordResetMutation,
  usePostForgotPasswordMutation,
  usePostResetPasswordMutation,
} = api;
