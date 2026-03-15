namespace IADMIN {
  type AdminAboutBlock = {
    id: number | null;
    title: string;
    text: string;
    img: string;
    sort_order: number;
  };

  type AdminAboutPage = {
    id: number | null;
    title: string;
    made: string;
    logo: string;
    updated_at: string | null;
    blocks: AdminAboutBlock[];
  };

  type GetDashboardReq =
    | {
        range?: AdminDateRange;
        date_from?: string;
        date_to?: string;
      }
    | void;
  type GetDashboardRes = AdminDashboardOverview;

  type GetRevenueReq =
    | {
        range?: AdminDateRange;
        date_from?: string;
        date_to?: string;
      }
    | void;
  type GetRevenueRes = AdminRevenuePoint[];

    type GetProductsReq = {
      page?: number;
      page_size?: number;
      search?: string;
      category_id?: number;
      is_active?: boolean;
      ordering?: "name" | "-name" | "created_at" | "-created_at" | "updated_at" | "-updated_at";
    };
  type GetProductsRes = AdminPaginatedResponse<AdminProduct>;

  type GetProductByIdReq = number;
  type GetProductByIdRes = AdminProduct;

  type PostProductReq = AdminProductPayload;
  type PostProductRes = AdminProduct;

  type PatchProductReq = {
    id: number;
    data: Partial<AdminProductPayload>;
  };
  type PatchProductRes = AdminProduct;

  type DeleteProductReq = number;
  type DeleteProductRes = {
    success: boolean;
    id: number;
  };

  type PostProductImagesReq = {
    id: number;
    files: File[];
    colors?: string[];
    replace_existing?: boolean;
  };
  type PostProductImagesRes = AdminProduct;

  type GetOrdersReq = {
    page?: number;
    page_size?: number;
    search?: string;
    external_ref?: string;
    ordering?: "newest" | "oldest" | "total_desc" | "total_asc" | "payment_status";
    status?: AdminOrderStatus;
    payment_status?: AdminPaymentStatus;
    delivery_method?: AdminDeliveryMethod;
    date_from?: string;
    date_to?: string;
  };
  type GetOrdersRes = AdminPaginatedResponse<AdminOrder>;

  type PatchOrderStatusReq = {
    id: number;
    status: AdminOrderStatus;
  };
  type PatchOrderStatusRes = AdminOrder;

  type GetUsersReq = {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: "newest" | "oldest" | "email_asc" | "email_desc" | "name_asc" | "name_desc";
    role?: AdminRole;
    is_active?: boolean;
  };
  type GetUsersRes = AdminPaginatedResponse<AdminUser>;

  type GetInventoryReq = {
    page?: number;
    page_size?: number;
    search?: string;
    product_id?: number;
    low_stock?: boolean;
  };
  type GetInventoryRes = AdminPaginatedResponse<AdminInventoryRecord>;

  type GetInventoryMovementsReq = {
    page?: number;
    page_size?: number;
    search?: string;
    product_id?: number;
    variant_id?: number;
    type?: AdminInventoryMovement["type"];
  };
  type GetInventoryMovementsRes = AdminPaginatedResponse<AdminInventoryMovement>;

  type GetRolesReq = void;
  type GetRolesRes = AdminRbacRole[];

  type GetPermissionsReq = void;
  type GetPermissionsRes = AdminPermissionItem[];

  type PostRoleReq = {
    key: string;
    name: string;
    description?: string;
    permissions: string[];
  };
  type PostRoleRes = AdminRbacRole;

  type PatchRoleReq = {
    id: number;
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    };
  };
  type PatchRoleRes = AdminRbacRole;

  type DeleteRoleReq = number;
  type DeleteRoleRes = {
    success: boolean;
    id: number;
  };

  type PatchUserRolesReq = {
    id: number;
    role_keys: string[];
  };
  type PatchUserRolesRes = AdminUserRoleAssignmentResult;

  type GetCategoriesReq = void;
  type GetCategoriesRes = AdminCategory[];

  type PostCategoryReq = AdminCategoryPayload;
  type PostCategoryRes = AdminCategory;

  type PatchCategoryReq = {
    id: number;
    data: Partial<AdminCategoryPayload>;
  };
  type PatchCategoryRes = AdminCategory;

  type DeleteCategoryReq = number;
  type DeleteCategoryRes = {
    success: boolean;
    id: number;
  };

  type GetContentReq = void;
  type GetContentRes = AdminCmsSection[];

  type PatchContentReq = {
    id: number;
    data: AdminCmsSectionPayload;
  };
  type PatchContentRes = AdminCmsSection;

  type GetHomeTitleReq = void;
  type GetHomeTitleRes = AdminHomeTitle;

  type PatchHomeTitleReq = {
    data: AdminHomeTitlePayload;
  };
  type PatchHomeTitleRes = AdminHomeTitle;

  type GetAboutPageReq = void;
  type GetAboutPageRes = AdminAboutPage;

  type PatchAboutPageReq = {
    data: {
      title?: string;
      made?: string;
      logo?: string;
      blocks?: Array<{
        title: string;
        text: string;
        img: string;
        sort_order: number;
      }>;
    };
  };
  type PatchAboutPageRes = AdminAboutPage;

  type UploadAboutImageReq = {
    file: File;
  };
  type UploadAboutImageRes = {
    image: string;
  };

  type GetActivityReq = {
    page?: number;
    page_size?: number;
    type?: AdminActivityType;
    entity?: AdminActivityEvent["entity"];
  };
  type GetActivityRes = AdminPaginatedResponse<AdminActivityEvent>;

  type GetAuditReq = {
    page?: number;
    page_size?: number;
    entity?: AdminAuditLog["entity"];
    action?: string;
    actor_id?: number;
    search?: string;
    trace_id?: string;
    date_from?: string;
    date_to?: string;
  };
  type GetAuditRes = AdminPaginatedResponse<AdminAuditLog>;

  type GetFinanceReq =
    | {
        range?: AdminDateRange;
        date_from?: string;
        date_to?: string;
      }
    | void;
  type GetFinanceRes = AdminFinanceSummary;
}
