namespace IADMIN {
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
    ordering?: string;
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
    status?: AdminOrderStatus;
    payment_status?: AdminPaymentStatus;
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
    role?: AdminRole;
    is_active?: boolean;
  };
  type GetUsersRes = AdminPaginatedResponse<AdminUser>;

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

  type GetActivityReq = {
    page?: number;
    page_size?: number;
    type?: AdminActivityType;
    entity?: AdminActivityEvent["entity"];
  };
  type GetActivityRes = AdminPaginatedResponse<AdminActivityEvent>;

  type GetFinanceReq =
    | {
        range?: AdminDateRange;
        date_from?: string;
        date_to?: string;
      }
    | void;
  type GetFinanceRes = AdminFinanceSummary;
}
