import { api as index } from "..";

const api = index.injectEndpoints({
  endpoints: (build) => ({
    getAdminDashboard: build.query<IADMIN.GetDashboardRes, IADMIN.GetDashboardReq>({
      query: (params) => ({
        url: "/admin/dashboard/",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["admin"],
    }),

    getAdminRevenue: build.query<IADMIN.GetRevenueRes, IADMIN.GetRevenueReq>({
      query: (params) => ({
        url: "/admin/analytics/revenue/",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["admin"],
    }),

    getAdminProducts: build.query<IADMIN.GetProductsRes, IADMIN.GetProductsReq>({
      query: (params) => ({
        url: "/admin/products/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    getAdminProductById: build.query<IADMIN.GetProductByIdRes, IADMIN.GetProductByIdReq>({
      query: (id) => ({
        url: `/admin/products/${id}/`,
        method: "GET",
      }),
      providesTags: ["admin"],
    }),

    postAdminProduct: build.mutation<IADMIN.PostProductRes, IADMIN.PostProductReq>({
      query: (data) => ({
        url: "/admin/products/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    patchAdminProduct: build.mutation<IADMIN.PatchProductRes, IADMIN.PatchProductReq>({
      query: ({ id, data }) => ({
        url: `/admin/products/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    deleteAdminProduct: build.mutation<IADMIN.DeleteProductRes, IADMIN.DeleteProductReq>({
      query: (id) => ({
        url: `/admin/products/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["admin"],
    }),

    postAdminProductImages: build.mutation<
      IADMIN.PostProductImagesRes,
      IADMIN.PostProductImagesReq
    >({
      query: ({ id, files, colors, replace_existing }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });
        (colors || []).forEach((color) => {
          formData.append("colors", color);
        });
        if (replace_existing !== undefined) {
          formData.append("replace_existing", String(replace_existing));
        }

        return {
          url: `/admin/products/${id}/images/`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["admin"],
    }),

    getAdminOrders: build.query<IADMIN.GetOrdersRes, IADMIN.GetOrdersReq>({
      query: (params) => ({
        url: "/admin/orders/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    patchAdminOrderStatus: build.mutation<
      IADMIN.PatchOrderStatusRes,
      IADMIN.PatchOrderStatusReq
    >({
      query: ({ id, status }) => ({
        url: `/admin/orders/${id}/status/`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["admin"],
    }),

    getAdminLeadRequests: build.query<IADMIN.GetLeadRequestsRes, IADMIN.GetLeadRequestsReq>({
      query: (params) => ({
        url: "/admin/lead-requests/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    patchAdminLeadRequestStatus: build.mutation<
      IADMIN.PatchLeadRequestStatusRes,
      IADMIN.PatchLeadRequestStatusReq
    >({
      query: ({ id, status, manager_note }) => ({
        url: `/admin/lead-requests/${id}/status/`,
        method: "PATCH",
        body: {
          status,
          manager_note,
        },
      }),
      invalidatesTags: ["admin"],
    }),

    getAdminUsers: build.query<IADMIN.GetUsersRes, IADMIN.GetUsersReq>({
      query: (params) => ({
        url: "/admin/users/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    getAdminInventory: build.query<IADMIN.GetInventoryRes, IADMIN.GetInventoryReq>({
      query: (params) => ({
        url: "/admin/inventory/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    getAdminInventoryMovements: build.query<
      IADMIN.GetInventoryMovementsRes,
      IADMIN.GetInventoryMovementsReq
    >({
      query: (params) => ({
        url: "/admin/inventory/movements/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    getAdminRoles: build.query<IADMIN.GetRolesRes, IADMIN.GetRolesReq>({
      query: () => ({
        url: "/admin/rbac/roles/",
        method: "GET",
      }),
      providesTags: ["admin"],
    }),

    getAdminPermissions: build.query<IADMIN.GetPermissionsRes, IADMIN.GetPermissionsReq>({
      query: () => ({
        url: "/admin/rbac/permissions/",
        method: "GET",
      }),
      providesTags: ["admin"],
    }),

    postAdminRole: build.mutation<IADMIN.PostRoleRes, IADMIN.PostRoleReq>({
      query: (data) => ({
        url: "/admin/rbac/roles/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    patchAdminRole: build.mutation<IADMIN.PatchRoleRes, IADMIN.PatchRoleReq>({
      query: ({ id, data }) => ({
        url: `/admin/rbac/roles/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    deleteAdminRole: build.mutation<IADMIN.DeleteRoleRes, IADMIN.DeleteRoleReq>({
      query: (id) => ({
        url: `/admin/rbac/roles/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["admin"],
    }),

    patchAdminUserRoles: build.mutation<IADMIN.PatchUserRolesRes, IADMIN.PatchUserRolesReq>({
      query: ({ id, role_keys }) => ({
        url: `/admin/users/${id}/roles/`,
        method: "PATCH",
        body: { role_keys },
      }),
      invalidatesTags: ["admin"],
    }),

    getAdminCategories: build.query<IADMIN.GetCategoriesRes, IADMIN.GetCategoriesReq>({
      query: () => ({
        url: "/admin/categories/",
        method: "GET",
      }),
      providesTags: ["admin"],
    }),

    postAdminCategory: build.mutation<IADMIN.PostCategoryRes, IADMIN.PostCategoryReq>({
      query: (data) => ({
        url: "/admin/categories/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    patchAdminCategory: build.mutation<IADMIN.PatchCategoryRes, IADMIN.PatchCategoryReq>({
      query: ({ id, data }) => ({
        url: `/admin/categories/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    deleteAdminCategory: build.mutation<IADMIN.DeleteCategoryRes, IADMIN.DeleteCategoryReq>({
      query: (id) => ({
        url: `/admin/categories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["admin"],
    }),

    getAdminContent: build.query<IADMIN.GetContentRes, IADMIN.GetContentReq>({
      query: () => ({
        url: "/admin/content/sections/",
        method: "GET",
      }),
      providesTags: ["admin"],
    }),

    patchAdminContent: build.mutation<IADMIN.PatchContentRes, IADMIN.PatchContentReq>({
      query: ({ id, data }) => ({
        url: `/admin/content/sections/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    getAdminHomeTitle: build.query<IADMIN.GetHomeTitleRes, IADMIN.GetHomeTitleReq>({
      query: () => ({
        url: "/admin/content/home-title/",
        method: "GET",
      }),
      providesTags: ["admin"],
    }),

    patchAdminHomeTitle: build.mutation<
      IADMIN.PatchHomeTitleRes,
      IADMIN.PatchHomeTitleReq
    >({
      query: ({ data }) => ({
        url: "/admin/content/home-title/",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    getAdminAboutPage: build.query<IADMIN.GetAboutPageRes, IADMIN.GetAboutPageReq>({
      query: () => ({
        url: "/admin/content/about/",
        method: "GET",
      }),
      providesTags: ["admin"],
    }),

    patchAdminAboutPage: build.mutation<
      IADMIN.PatchAboutPageRes,
      IADMIN.PatchAboutPageReq
    >({
      query: ({ data }) => ({
        url: "/admin/content/about/",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["admin"],
    }),

    uploadAdminAboutImage: build.mutation<
      IADMIN.UploadAboutImageRes,
      IADMIN.UploadAboutImageReq
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/admin/content/about/image/",
          method: "POST",
          body: formData,
        };
      },
    }),

    getAdminActivity: build.query<IADMIN.GetActivityRes, IADMIN.GetActivityReq>({
      query: (params) => ({
        url: "/admin/activity/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    getAdminAudit: build.query<IADMIN.GetAuditRes, IADMIN.GetAuditReq>({
      query: (params) => ({
        url: "/admin/audit/",
        method: "GET",
        params,
      }),
      providesTags: ["admin"],
    }),

    getAdminFinanceSummary: build.query<IADMIN.GetFinanceRes, IADMIN.GetFinanceReq>({
      query: (params) => ({
        url: "/admin/finance/summary/",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["admin"],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminRevenueQuery,
  useGetAdminProductsQuery,
  useGetAdminProductByIdQuery,
  usePostAdminProductMutation,
  usePatchAdminProductMutation,
  useDeleteAdminProductMutation,
  usePostAdminProductImagesMutation,
  useGetAdminOrdersQuery,
  usePatchAdminOrderStatusMutation,
  useGetAdminLeadRequestsQuery,
  usePatchAdminLeadRequestStatusMutation,
  useGetAdminUsersQuery,
  useGetAdminInventoryQuery,
  useGetAdminInventoryMovementsQuery,
  useGetAdminRolesQuery,
  useGetAdminPermissionsQuery,
  usePostAdminRoleMutation,
  usePatchAdminRoleMutation,
  useDeleteAdminRoleMutation,
  usePatchAdminUserRolesMutation,
  useGetAdminCategoriesQuery,
  usePostAdminCategoryMutation,
  usePatchAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useGetAdminContentQuery,
  usePatchAdminContentMutation,
  useGetAdminHomeTitleQuery,
  usePatchAdminHomeTitleMutation,
  useGetAdminAboutPageQuery,
  usePatchAdminAboutPageMutation,
  useUploadAdminAboutImageMutation,
  useGetAdminActivityQuery,
  useGetAdminAuditQuery,
  useGetAdminFinanceSummaryQuery,
} = api;
