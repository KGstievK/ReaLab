"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiBox,
  FiFileText,
  FiPercent,
  FiPlus,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { AdminActivitySection } from "./sections/AdminActivitySection";
import { AdminContentSection } from "./sections/AdminContentSection";
import { AdminDashboardSection } from "./sections/AdminDashboardSection";
import { AdminDiscountsSection } from "./sections/AdminDiscountsSection";
import { AdminInventorySection } from "./sections/AdminInventorySection";
import { AdminOrdersSection } from "./sections/AdminOrdersSection";
import { AdminProductsSection } from "./sections/AdminProductsSection";
import { AdminUsersSection } from "./sections/AdminUsersSection";
import { AdminOrderDetailsModal } from "./sections/AdminOrderDetailsModal";
import { AdminProductModal } from "./sections/AdminProductModal";
import {
  AboutBlockFormState,
  AboutPageFormState,
  AdminTab,
  HomeTitleFormState,
  ProductFormState,
  ProductModalMode,
} from "./AdminPanel.types";
import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  getDiscountPercent,
  getEffectiveProductPrice,
  getNextOrderStatus,
  hasPermission,
  normalizeWorkflowStatus,
  RANGE_LABELS,
  RANGE_OPTIONS,
  STATUS_LABELS,
} from "./AdminPanel.shared";
import {
  useGetAdminActivityQuery,
  useGetAdminAuditQuery,
  useGetAdminAboutPageQuery,
  useGetAdminCategoriesQuery,
  useGetAdminContentQuery,
  useGetAdminDashboardQuery,
  useGetAdminFinanceSummaryQuery,
  useGetAdminHomeTitleQuery,
  useGetAdminInventoryMovementsQuery,
  useGetAdminInventoryQuery,
  useGetAdminOrdersQuery,
  useGetAdminPermissionsQuery,
  useGetAdminProductsQuery,
  useGetAdminRolesQuery,
  useGetAdminUsersQuery,
  useDeleteAdminRoleMutation,
  useDeleteAdminProductMutation,
  usePatchAdminAboutPageMutation,
  usePatchAdminHomeTitleMutation,
  usePatchAdminProductMutation,
  usePatchAdminOrderStatusMutation,
  usePatchAdminRoleMutation,
  usePatchAdminUserRolesMutation,
  usePostAdminRoleMutation,
  usePostAdminProductMutation,
  usePostAdminProductImagesMutation,
  useUploadAdminAboutImageMutation,
} from "../../../../../redux/api/admin";
import { useGetMeQuery } from "../../../../../redux/api/auth";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";
import scss from "./AdminPanel.module.scss";

const parseCsv = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const MAX_PRODUCT_IMAGE_SIZE_MB = 7;
const MAX_PRODUCT_IMAGE_SIZE_BYTES = MAX_PRODUCT_IMAGE_SIZE_MB * 1024 * 1024;
const ALLOWED_PRODUCT_IMAGE_EXTENSIONS = new Set([
  "svg",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "jfif",
  "avif",
]);

const normalizeListForCompare = (values: string[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).sort();

const hasDifferentListValues = (left: string[], right: string[]): boolean => {
  const leftNormalized = normalizeListForCompare(left);
  const rightNormalized = normalizeListForCompare(right);

  if (leftNormalized.length !== rightNormalized.length) {
    return true;
  }

  return leftNormalized.some((value, index) => value !== rightNormalized[index]);
};

const getApiUiMessage = (
  error: unknown,
  fallback: string,
  rateLimitFallback = "Слишком много действий в админке. Попробуйте позже.",
) => {
  const apiError = extractApiErrorInfo(error, fallback);
  return {
    type: "error" as const,
    text: getRateLimitAwareMessage(apiError, rateLimitFallback),
    traceId: apiError.traceId || undefined,
  };
};

const toStringOrEmpty = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

const createEmptyProductForm = (defaultCategoryId: number): ProductFormState => ({
  name: "",
  description: "",
  category_id: String(defaultCategoryId),
  textile_name: "",
  active: true,
  base_price: "",
  cost_price: "",
  discount_price: "",
  sizes: "XXS, XS, S, M, L, XL, XXL",
  colors: "",
  promo_categories: "",
});

const createEmptyHomeTitleForm = (): HomeTitleFormState => ({
  made: "",
  title: "",
  clothes1_id: "",
  clothes2_id: "",
  clothes3_id: "",
});

const createEmptyAboutBlockForm = (sortOrder: number): AboutBlockFormState => ({
  title: "",
  text: "",
  img: "",
  sort_order: String(sortOrder),
});

const createEmptyAboutPageForm = (): AboutPageFormState => ({
  title: "",
  made: "",
  logo: "",
  blocks: [
    createEmptyAboutBlockForm(1),
    createEmptyAboutBlockForm(2),
    createEmptyAboutBlockForm(3),
  ],
});

const productToForm = (product: AdminProduct): ProductFormState => {
  const variantSizes = Array.from(new Set(product.variants.map((item) => item.size)));
  const variantColors = Array.from(new Set(product.variants.map((item) => item.color)));
  const firstVariant = product.variants[0];

  return {
    name: product.name,
    description: product.description,
    category_id: String(product.category_id),
    textile_name: product.textile_name || "",
    active: product.active,
    base_price: toStringOrEmpty(product.base_price ?? firstVariant?.price ?? 0),
    cost_price: toStringOrEmpty(product.cost_price ?? firstVariant?.cost_price ?? 0),
    discount_price: toStringOrEmpty(product.discount_price ?? firstVariant?.discount_price ?? null),
    sizes: variantSizes.join(", "),
    colors: variantColors.join(", "),
    promo_categories: (product.promo_categories || []).join(", "),
  };
};

const NAV_ITEMS: Array<{ key: AdminTab; label: string; icon: ReactNode; permission: AdminPermission }> = [
  {
    key: "dashboard",
    label: "Аналитика",
    icon: <FiBarChart2 />,
    permission: ADMIN_PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    key: "products",
    label: "Товары",
    icon: <FiShoppingBag />,
    permission: ADMIN_PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    key: "discounts",
    label: "Скидки",
    icon: <FiPercent />,
    permission: ADMIN_PERMISSIONS.DISCOUNTS_VIEW,
  },
  {
    key: "orders",
    label: "Заказы",
    icon: <FiFileText />,
    permission: ADMIN_PERMISSIONS.ORDERS_VIEW,
  },
  {
    key: "content",
    label: "Контент",
    icon: <FiBox />,
    permission: ADMIN_PERMISSIONS.CONTENT_VIEW,
  },
  {
    key: "users",
    label: "Пользователи",
    icon: <FiUsers />,
    permission: ADMIN_PERMISSIONS.USERS_VIEW,
  },
  {
    key: "activity",
    label: "События",
    icon: <FiActivity />,
    permission: ADMIN_PERMISSIONS.ACTIVITY_VIEW,
  },
];

const ORDER_STATUS_FILTER_OPTIONS = Object.keys(STATUS_LABELS) as AdminOrderStatus[];
const PAYMENT_STATUS_FILTER_OPTIONS = ["pending", "paid", "failed", "refunded"] as const;
const DELIVERY_METHOD_FILTER_OPTIONS = ["courier", "pickup"] as const;
const PRODUCT_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const PRODUCT_SORT_OPTIONS = [
  "-updated_at",
  "updated_at",
  "-created_at",
  "created_at",
  "name",
  "-name",
] as const;
const DISCOUNT_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DISCOUNT_SORT_OPTIONS = [
  "-updated_at",
  "updated_at",
  "-created_at",
  "created_at",
  "name",
  "-name",
] as const;
const ORDER_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const ORDER_SORT_OPTIONS = ["newest", "oldest", "total_desc", "total_asc", "payment_status"] as const;
const USER_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const USER_SORT_OPTIONS = ["newest", "oldest", "email_asc", "email_desc", "name_asc", "name_desc"] as const;

const MOCK_ORDERS: AdminOrder[] = [
  {
    id: 1050486,
    order_number: "#1050486",
    customer_id: 51,
    customer_name: "Айгерим Н.",
    customer_phone: "+996 555 00-00-00",
    city: "Bishkek",
    address: "ABC 12A, Bishkek, Kyrgyzstan",
    created_at: "2026-02-26T10:20:00.000Z",
    updated_at: "2026-02-27T13:10:00.000Z",
    status: "placed",
    payment_status: "paid",
    delivery_method: "courier",
    subtotal: 4800,
    delivery_price: 200,
    discount_amount: 600,
    total_amount: 4400,
    items: [
      {
        product_id: 201,
        product_name: "JUMANA 24",
        quantity: 2,
        unit_price: 1400,
        total_price: 2800,
        size: "M",
        color: "Черный",
        image_url: "",
      },
    ],
  },
  {
    id: 1050487,
    order_number: "#1050487",
    customer_id: 77,
    customer_name: "Сабина К.",
    customer_phone: "+996 700 11-22-33",
    city: "Bishkek",
    address: "Manas 44, Bishkek, Kyrgyzstan",
    created_at: "2026-02-25T08:15:00.000Z",
    updated_at: "2026-02-26T16:10:00.000Z",
    status: "shipping",
    payment_status: "paid",
    delivery_method: "courier",
    subtotal: 6200,
    delivery_price: 200,
    discount_amount: 300,
    total_amount: 6100,
    items: [
      {
        product_id: 220,
        product_name: "Hijab Premium",
        quantity: 3,
        unit_price: 2000,
        total_price: 6000,
        size: "One size",
        color: "Песочный",
        image_url: "",
      },
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_DASHBOARD: AdminDashboardOverview = {
  generated_at: "2026-02-28T10:00:00.000Z",
  range: "month",
  currency: "KGS",
  kpis: [
    {
      id: "revenue",
      label: "Доход",
      value: 154000,
      trend: "up",
      delta_percent: 8.2,
    },
    {
      id: "orders",
      label: "Заказы",
      value: 126,
      trend: "up",
      delta_percent: 4.1,
    },
    {
      id: "sold_items",
      label: "Продано товаров",
      value: 342,
      trend: "up",
      delta_percent: 6.7,
    },
    {
      id: "added_products",
      label: "Добавлено товаров",
      value: 19,
      trend: "flat",
      delta_percent: 0,
    },
  ],
  revenue_series: [
    {
      date: "2026-02-24",
      revenue: 15600,
      expenses: 6100,
      profit: 9500,
      orders: 13,
      sold_items: 28,
      added_products: 2,
    },
    {
      date: "2026-02-25",
      revenue: 27800,
      expenses: 9400,
      profit: 18400,
      orders: 22,
      sold_items: 55,
      added_products: 5,
    },
    {
      date: "2026-02-26",
      revenue: 23600,
      expenses: 8900,
      profit: 14700,
      orders: 19,
      sold_items: 48,
      added_products: 3,
    },
    {
      date: "2026-02-27",
      revenue: 20800,
      expenses: 7600,
      profit: 13200,
      orders: 17,
      sold_items: 44,
      added_products: 2,
    },
    {
      date: "2026-02-28",
      revenue: 26200,
      expenses: 9800,
      profit: 16400,
      orders: 23,
      sold_items: 58,
      added_products: 1,
    },
  ],
  top_products: [
    {
      product_id: 201,
      product_name: "JUMANA 24",
      sold_items: 48,
      orders_count: 31,
      revenue: 67200,
      current_stock: 27,
    },
    {
      product_id: 220,
      product_name: "Hijab Premium",
      sold_items: 41,
      orders_count: 25,
      revenue: 58200,
      current_stock: 12,
    },
    {
      product_id: 204,
      product_name: "Abaya Classic",
      sold_items: 35,
      orders_count: 21,
      revenue: 49700,
      current_stock: 6,
    },
  ],
  low_stock: [
    {
      product_id: 204,
      product_name: "Abaya Classic",
      sku: "ABA-CLS-004",
      stock: 6,
      min_stock: 10,
      updated_at: "2026-02-28T09:10:00.000Z",
      is_low_stock: true,
    },
  ],
  recent_orders: MOCK_ORDERS,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_PRODUCTS: AdminPaginatedResponse<AdminProduct> = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      id: 201,
      name: "JUMANA 24",
      slug: "jumana-24",
      description: "Базовое платье из мягкой ткани.",
      category_id: 4,
      category_name: "Платья",
      textile_name: "Тафета",
      created_at: "2026-02-10T10:20:00.000Z",
      updated_at: "2026-02-27T18:00:00.000Z",
      active: true,
      average_rating: 4.8,
      sold_items: 48,
      total_stock: 27,
      base_price: 4800,
      discount_price: 4400,
      cost_price: 2600,
      promo_categories: ["популярные", "тренд"],
      images: [],
      variants: [],
    },
    {
      id: 220,
      name: "Hijab Premium",
      slug: "hijab-premium",
      description: "Премиальный хиджаб, легкий и дышащий.",
      category_id: 2,
      category_name: "Хиджабы",
      textile_name: "Шелк",
      created_at: "2026-02-11T09:00:00.000Z",
      updated_at: "2026-02-27T17:00:00.000Z",
      active: true,
      average_rating: 4.7,
      sold_items: 41,
      total_stock: 12,
      base_price: 2200,
      discount_price: 1900,
      cost_price: 1200,
      promo_categories: ["новинка"],
      images: [],
      variants: [],
    },
    {
      id: 240,
      name: "Cape Winter",
      slug: "cape-winter",
      description: "Утепленный кейп для холодного сезона.",
      category_id: 6,
      category_name: "Накидки",
      textile_name: "Шерсть",
      created_at: "2026-02-20T12:20:00.000Z",
      updated_at: "2026-02-26T12:00:00.000Z",
      active: false,
      average_rating: 4.1,
      sold_items: 7,
      total_stock: 22,
      base_price: 5600,
      discount_price: null,
      cost_price: 3400,
      promo_categories: [],
      images: [],
      variants: [],
    },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_USERS: AdminPaginatedResponse<AdminUser> = {
  count: 2,
  next: null,
  previous: null,
  results: [
      {
        id: 1,
        first_name: "Aigerim",
        last_name: "N",
        email: "aigerim@gmail.com",
        phone_number: "+996555000000",
        legacy_role: "customer",
        role: "customer",
        is_active: true,
        created_at: "2025-08-12T08:00:00.000Z",
        total_orders: 8,
        total_spent: 35200,
        last_order_at: "2026-02-27T13:10:00.000Z",
        assigned_roles: [],
        permissions: [],
      },
      {
        id: 3,
        first_name: "Admin",
        last_name: "Manager",
        email: "manager@jumana.com",
        phone_number: "+996777001122",
        legacy_role: "manager",
        role: "manager",
        is_active: true,
        created_at: "2025-01-18T09:00:00.000Z",
        total_orders: 0,
        total_spent: 0,
        last_order_at: null,
        assigned_roles: [],
        permissions: [],
      },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_CONTENT: AdminCmsSection[] = [
  {
    id: 1,
    section_code: "home_welcome",
    section_name: "Главный баннер",
    updated_at: "2026-02-26T11:00:00.000Z",
    blocks: [
      {
        id: 1,
        key: "slide_1",
        title: "Скромность, воплощенная в элегантности",
        subtitle: "Made in Kyrgyzstan",
        image: "/media/banner-1.jpg",
        cta_text: "Каталог",
        cta_link: "/catalog",
        sort_order: 1,
        active: true,
      },
    ],
  },
  {
    id: 2,
    section_code: "home_sale",
    section_name: "Секция скидок",
    updated_at: "2026-02-25T17:20:00.000Z",
    blocks: [
      {
        id: 2,
        key: "sale_1",
        title: "Скидки до 50%",
        subtitle: "Не упустите шанс",
        image: "/media/sale-1.jpg",
        cta_text: "Подробнее",
        cta_link: "/sale",
        sort_order: 1,
        active: true,
      },
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_ACTIVITY: AdminPaginatedResponse<AdminActivityEvent> = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      type: "order_created",
      entity: "order",
      entity_id: 1050486,
      entity_label: "#1050486",
      message: "Новый заказ оформлен",
      created_at: "2026-02-27T13:10:00.000Z",
      actor: { id: 1, name: "Aigerim N", role: "customer" },
      metadata: { total: 4400 },
    },
    {
      id: 2,
      type: "product_updated",
      entity: "product",
      entity_id: 201,
      entity_label: "JUMANA 24",
      message: "Обновлена цена товара",
      created_at: "2026-02-26T12:20:00.000Z",
      actor: { id: 3, name: "Admin Manager", role: "manager" },
      metadata: { new_price: 1400 },
    },
    {
      id: 3,
      type: "content_updated",
      entity: "content",
      entity_id: 2,
      entity_label: "Секция скидок",
      message: "Обновлен баннер главной страницы",
      created_at: "2026-02-25T08:30:00.000Z",
      actor: { id: 3, name: "Admin Manager", role: "manager" },
      metadata: { section: "home_sale" },
    },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_FINANCE: AdminFinanceSummary = {
  period_start: "2026-02-01",
  period_end: "2026-02-28",
  currency: "KGS",
  product_revenue: 150800,
  gross_revenue: 154000,
  net_revenue: 141900,
  discount_total: 9100,
  delivery_income: 3200,
  refund_total: 2600,
  expenses_total: 57800,
  cost_of_goods_sold: 57800,
  profit: 84100,
  average_order_value: 1222,
  paid_orders: 116,
  failed_orders: 10,
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [range, setRange] = useState<AdminDateRange>("month");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState<
    (typeof PRODUCT_PAGE_SIZE_OPTIONS)[number]
  >(20);
  const [productSort, setProductSort] = useState<(typeof PRODUCT_SORT_OPTIONS)[number]>(
    "-updated_at",
  );
  const [productCategoryFilter, setProductCategoryFilter] = useState<number | "all">("all");
  const [productActiveFilter, setProductActiveFilter] = useState<"all" | "active" | "draft">(
    "all",
  );
  const [discountSearch, setDiscountSearch] = useState("");
  const [discountPage, setDiscountPage] = useState(1);
  const [discountPageSize, setDiscountPageSize] = useState<
    (typeof DISCOUNT_PAGE_SIZE_OPTIONS)[number]
  >(20);
  const [discountSort, setDiscountSort] = useState<(typeof DISCOUNT_SORT_OPTIONS)[number]>(
    "-updated_at",
  );
  const [discountCategoryFilter, setDiscountCategoryFilter] = useState<number | "all">("all");
  const [discountActiveFilter, setDiscountActiveFilter] = useState<"all" | "active" | "draft">(
    "all",
  );
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState<(typeof ORDER_PAGE_SIZE_OPTIONS)[number]>(20);
  const [orderExternalRefFilter, setOrderExternalRefFilter] = useState("");
  const [orderSort, setOrderSort] = useState<(typeof ORDER_SORT_OPTIONS)[number]>("newest");
  const [orderStatusFilter, setOrderStatusFilter] = useState<AdminOrderStatus | "all">("all");
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState<
    AdminPaymentStatus | "all"
  >("all");
  const [orderDeliveryMethodFilter, setOrderDeliveryMethodFilter] = useState<
    AdminDeliveryMethod | "all"
  >("all");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState<(typeof USER_PAGE_SIZE_OPTIONS)[number]>(20);
  const [userSort, setUserSort] = useState<(typeof USER_SORT_OPTIONS)[number]>("newest");
  const [userRoleFilter, setUserRoleFilter] = useState<AdminRole | "all">("all");
  const [userActiveFilter, setUserActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [isUrlStateReady, setIsUrlStateReady] = useState(false);
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityEntityFilter, setActivityEntityFilter] = useState<
    AdminActivityEvent["entity"] | "all"
  >("all");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditTraceIdFilter, setAuditTraceIdFilter] = useState("");
  const [auditActorIdFilter, setAuditActorIdFilter] = useState<number | "all">("all");
  const [activityPage, setActivityPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [inventoryMovementType, setInventoryMovementType] = useState<
    AdminInventoryMovement["type"] | "all"
  >("all");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<Pick<
    AdminInventoryRecord,
    "product_id" | "variant_id" | "product_name" | "sku" | "size" | "color"
  > | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    traceId?: string;
  } | null>(null);
  const [productModalMode, setProductModalMode] =
    useState<ProductModalMode>("create");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(
    createEmptyProductForm(1),
  );
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [discountDrafts, setDiscountDrafts] = useState<Record<number, string>>({});
  const [discountSavingId, setDiscountSavingId] = useState<number | null>(null);
  const [homeTitleForm, setHomeTitleForm] = useState<HomeTitleFormState>(
    createEmptyHomeTitleForm(),
  );
  const [aboutPageForm, setAboutPageForm] = useState<AboutPageFormState>(
    createEmptyAboutPageForm(),
  );
  const [aboutUploadingHero, setAboutUploadingHero] = useState(false);
  const [aboutUploadingBlockIndex, setAboutUploadingBlockIndex] = useState<number | null>(null);
  const productImageInputRef = useRef<HTMLInputElement | null>(null);
  const aboutHeroInputRef = useRef<HTMLInputElement | null>(null);
  const aboutBlockInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { data: meData } = useGetMeQuery();
  const currentUser = meData?.[0];
  const currentPermissions = currentUser?.permissions ?? [];
  const canAccessAdmin =
    currentUser?.role === "owner" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    hasPermission(currentPermissions, ADMIN_PERMISSIONS.ADMIN_ACCESS);
  const canManageProducts = hasPermission(currentPermissions, ADMIN_PERMISSIONS.PRODUCTS_MANAGE);
  const canDeleteProducts = hasPermission(currentPermissions, ADMIN_PERMISSIONS.PRODUCTS_DELETE);
  const canManageDiscounts = hasPermission(currentPermissions, ADMIN_PERMISSIONS.DISCOUNTS_MANAGE);
  const canManageOrders = hasPermission(currentPermissions, ADMIN_PERMISSIONS.ORDERS_MANAGE);
  const canManageContent = hasPermission(currentPermissions, ADMIN_PERMISSIONS.CONTENT_MANAGE);
  const canManageUsers = hasPermission(currentPermissions, ADMIN_PERMISSIONS.USERS_MANAGE);
  const visibleNavItems = currentUser
    ? NAV_ITEMS.filter((item) => hasPermission(currentPermissions, item.permission))
    : NAV_ITEMS;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && NAV_ITEMS.some((item) => item.key === tab)) {
      setActiveTab(tab as AdminTab);
    }

    setProductSearch(params.get("product_search") || "");

    const productSortParam = params.get("product_sort");
    if (
      productSortParam &&
      PRODUCT_SORT_OPTIONS.includes(productSortParam as (typeof PRODUCT_SORT_OPTIONS)[number])
    ) {
      setProductSort(productSortParam as (typeof PRODUCT_SORT_OPTIONS)[number]);
    }

    const productCategoryParam = Number(params.get("product_category_id"));
    if (Number.isFinite(productCategoryParam) && productCategoryParam > 0) {
      setProductCategoryFilter(productCategoryParam);
    }

    const productActiveParam = params.get("product_active");
    if (productActiveParam === "active" || productActiveParam === "draft") {
      setProductActiveFilter(productActiveParam);
    }

    const productPageParam = Number(params.get("product_page"));
    if (Number.isFinite(productPageParam) && productPageParam > 0) {
      setProductPage(productPageParam);
    }

    const productPageSizeParam = Number(params.get("product_page_size"));
    if (
      Number.isFinite(productPageSizeParam) &&
      PRODUCT_PAGE_SIZE_OPTIONS.includes(
        productPageSizeParam as (typeof PRODUCT_PAGE_SIZE_OPTIONS)[number],
      )
    ) {
      setProductPageSize(productPageSizeParam as (typeof PRODUCT_PAGE_SIZE_OPTIONS)[number]);
    }

    setDiscountSearch(params.get("discount_search") || "");

    const discountSortParam = params.get("discount_sort");
    if (
      discountSortParam &&
      DISCOUNT_SORT_OPTIONS.includes(discountSortParam as (typeof DISCOUNT_SORT_OPTIONS)[number])
    ) {
      setDiscountSort(discountSortParam as (typeof DISCOUNT_SORT_OPTIONS)[number]);
    }

    const discountCategoryParam = Number(params.get("discount_category_id"));
    if (Number.isFinite(discountCategoryParam) && discountCategoryParam > 0) {
      setDiscountCategoryFilter(discountCategoryParam);
    }

    const discountActiveParam = params.get("discount_active");
    if (discountActiveParam === "active" || discountActiveParam === "draft") {
      setDiscountActiveFilter(discountActiveParam);
    }

    const discountPageParam = Number(params.get("discount_page"));
    if (Number.isFinite(discountPageParam) && discountPageParam > 0) {
      setDiscountPage(discountPageParam);
    }

    const discountPageSizeParam = Number(params.get("discount_page_size"));
    if (
      Number.isFinite(discountPageSizeParam) &&
      DISCOUNT_PAGE_SIZE_OPTIONS.includes(
        discountPageSizeParam as (typeof DISCOUNT_PAGE_SIZE_OPTIONS)[number],
      )
    ) {
      setDiscountPageSize(discountPageSizeParam as (typeof DISCOUNT_PAGE_SIZE_OPTIONS)[number]);
    }

    setOrderSearch(params.get("order_search") || "");
    setOrderExternalRefFilter(params.get("order_external_ref") || "");

    const orderSortParam = params.get("order_sort");
    if (
      orderSortParam &&
      ORDER_SORT_OPTIONS.includes(orderSortParam as (typeof ORDER_SORT_OPTIONS)[number])
    ) {
      setOrderSort(orderSortParam as (typeof ORDER_SORT_OPTIONS)[number]);
    }

    const orderStatus = params.get("order_status");
    if (orderStatus && ORDER_STATUS_FILTER_OPTIONS.includes(orderStatus as AdminOrderStatus)) {
      setOrderStatusFilter(orderStatus as AdminOrderStatus);
    }

    const orderPaymentStatus = params.get("order_payment_status");
    if (
      orderPaymentStatus &&
      PAYMENT_STATUS_FILTER_OPTIONS.includes(orderPaymentStatus as AdminPaymentStatus)
    ) {
      setOrderPaymentStatusFilter(orderPaymentStatus as AdminPaymentStatus);
    }

    const orderDeliveryMethod = params.get("order_delivery_method");
    if (
      orderDeliveryMethod &&
      DELIVERY_METHOD_FILTER_OPTIONS.includes(orderDeliveryMethod as AdminDeliveryMethod)
    ) {
      setOrderDeliveryMethodFilter(orderDeliveryMethod as AdminDeliveryMethod);
    }

    setOrderDateFrom(params.get("order_date_from") || "");
    setOrderDateTo(params.get("order_date_to") || "");

    const pageParam = Number(params.get("order_page"));
    if (Number.isFinite(pageParam) && pageParam > 0) {
      setOrderPage(pageParam);
    }

    const pageSizeParam = Number(params.get("order_page_size"));
    if (
      Number.isFinite(pageSizeParam) &&
      ORDER_PAGE_SIZE_OPTIONS.includes(pageSizeParam as (typeof ORDER_PAGE_SIZE_OPTIONS)[number])
    ) {
      setOrderPageSize(pageSizeParam as (typeof ORDER_PAGE_SIZE_OPTIONS)[number]);
    }

    setUserSearch(params.get("user_search") || "");

    const userSortParam = params.get("user_sort");
    if (
      userSortParam &&
      USER_SORT_OPTIONS.includes(userSortParam as (typeof USER_SORT_OPTIONS)[number])
    ) {
      setUserSort(userSortParam as (typeof USER_SORT_OPTIONS)[number]);
    }

    const userRoleParam = params.get("user_role");
    if (userRoleParam && ["customer", "manager", "admin", "owner"].includes(userRoleParam)) {
      setUserRoleFilter(userRoleParam as AdminRole);
    }

    const userActiveParam = params.get("user_active");
    if (userActiveParam === "active" || userActiveParam === "inactive") {
      setUserActiveFilter(userActiveParam);
    }

    const userPageParam = Number(params.get("user_page"));
    if (Number.isFinite(userPageParam) && userPageParam > 0) {
      setUserPage(userPageParam);
    }

    const userPageSizeParam = Number(params.get("user_page_size"));
    if (
      Number.isFinite(userPageSizeParam) &&
      USER_PAGE_SIZE_OPTIONS.includes(userPageSizeParam as (typeof USER_PAGE_SIZE_OPTIONS)[number])
    ) {
      setUserPageSize(userPageSizeParam as (typeof USER_PAGE_SIZE_OPTIONS)[number]);
    }

    setIsUrlStateReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isUrlStateReady) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("tab", activeTab);

    if (productSearch) params.set("product_search", productSearch);
    else params.delete("product_search");

    if (productSort !== "-updated_at") params.set("product_sort", productSort);
    else params.delete("product_sort");

    if (productCategoryFilter !== "all") {
      params.set("product_category_id", String(productCategoryFilter));
    } else params.delete("product_category_id");

    if (productActiveFilter !== "all") params.set("product_active", productActiveFilter);
    else params.delete("product_active");

    if (productPage > 1) params.set("product_page", String(productPage));
    else params.delete("product_page");

    if (productPageSize !== 20) params.set("product_page_size", String(productPageSize));
    else params.delete("product_page_size");

    if (discountSearch) params.set("discount_search", discountSearch);
    else params.delete("discount_search");

    if (discountSort !== "-updated_at") params.set("discount_sort", discountSort);
    else params.delete("discount_sort");

    if (discountCategoryFilter !== "all") {
      params.set("discount_category_id", String(discountCategoryFilter));
    } else params.delete("discount_category_id");

    if (discountActiveFilter !== "all") params.set("discount_active", discountActiveFilter);
    else params.delete("discount_active");

    if (discountPage > 1) params.set("discount_page", String(discountPage));
    else params.delete("discount_page");

    if (discountPageSize !== 20) params.set("discount_page_size", String(discountPageSize));
    else params.delete("discount_page_size");

    if (orderSearch) params.set("order_search", orderSearch);
    else params.delete("order_search");

    if (orderExternalRefFilter) params.set("order_external_ref", orderExternalRefFilter);
    else params.delete("order_external_ref");

    if (orderSort !== "newest") params.set("order_sort", orderSort);
    else params.delete("order_sort");

    if (orderStatusFilter !== "all") params.set("order_status", orderStatusFilter);
    else params.delete("order_status");

    if (orderPaymentStatusFilter !== "all") {
      params.set("order_payment_status", orderPaymentStatusFilter);
    } else {
      params.delete("order_payment_status");
    }

    if (orderDeliveryMethodFilter !== "all") {
      params.set("order_delivery_method", orderDeliveryMethodFilter);
    } else {
      params.delete("order_delivery_method");
    }

    if (orderDateFrom) params.set("order_date_from", orderDateFrom);
    else params.delete("order_date_from");

    if (orderDateTo) params.set("order_date_to", orderDateTo);
    else params.delete("order_date_to");

    if (orderPage > 1) params.set("order_page", String(orderPage));
    else params.delete("order_page");

    if (orderPageSize !== 20) params.set("order_page_size", String(orderPageSize));
    else params.delete("order_page_size");

    if (userSearch) params.set("user_search", userSearch);
    else params.delete("user_search");

    if (userSort !== "newest") params.set("user_sort", userSort);
    else params.delete("user_sort");

    if (userRoleFilter !== "all") params.set("user_role", userRoleFilter);
    else params.delete("user_role");

    if (userActiveFilter !== "all") params.set("user_active", userActiveFilter);
    else params.delete("user_active");

    if (userPage > 1) params.set("user_page", String(userPage));
    else params.delete("user_page");

    if (userPageSize !== 20) params.set("user_page_size", String(userPageSize));
    else params.delete("user_page_size");

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [
    activeTab,
    productSearch,
    productSort,
    productCategoryFilter,
    productActiveFilter,
    productPage,
    productPageSize,
    discountSearch,
    discountSort,
    discountCategoryFilter,
    discountActiveFilter,
    discountPage,
    discountPageSize,
    orderSearch,
    orderExternalRefFilter,
    orderSort,
    orderStatusFilter,
    orderPaymentStatusFilter,
    orderDeliveryMethodFilter,
    orderDateFrom,
    orderDateTo,
    orderPage,
    orderPageSize,
    userSearch,
    userSort,
    userRoleFilter,
    userActiveFilter,
    userPage,
    userPageSize,
    isUrlStateReady,
  ]);

  const dashboardQuery = useGetAdminDashboardQuery(
    { range },
    { skip: activeTab !== "dashboard" },
  );
  const financeQuery = useGetAdminFinanceSummaryQuery(
    { range },
    { skip: activeTab !== "dashboard" },
  );
  const productsQuery = useGetAdminProductsQuery(
    activeTab === "products"
      ? {
          page: productPage,
          page_size: productPageSize,
          search: productSearch || undefined,
          category_id: productCategoryFilter === "all" ? undefined : productCategoryFilter,
          is_active:
            productActiveFilter === "all"
              ? undefined
              : productActiveFilter === "active",
          ordering: productSort,
        }
      : activeTab === "discounts"
        ? {
            page: discountPage,
            page_size: discountPageSize,
            search: discountSearch || undefined,
            category_id: discountCategoryFilter === "all" ? undefined : discountCategoryFilter,
            is_active:
              discountActiveFilter === "all"
                ? undefined
                : discountActiveFilter === "active",
            ordering: discountSort,
          }
        : { page: 1, page_size: 50, search: search || undefined },
    { skip: activeTab !== "products" && activeTab !== "discounts" },
  );
  const inventoryQuery = useGetAdminInventoryQuery(
    {
      page: 1,
      page_size: 20,
      search: productSearch || undefined,
      low_stock: inventoryLowStockOnly || undefined,
    },
    { skip: activeTab !== "products" },
  );
  const inventoryMovementsQuery = useGetAdminInventoryMovementsQuery(
    {
      page: 1,
      page_size: 12,
      search: productSearch || undefined,
      product_id: selectedInventoryItem?.product_id,
      variant_id: selectedInventoryItem?.variant_id,
      type: inventoryMovementType === "all" ? undefined : inventoryMovementType,
    },
    { skip: activeTab !== "products" },
  );
  const contentProductsQuery = useGetAdminProductsQuery(
    { page: 1, page_size: 200 },
    { skip: activeTab !== "content" },
  );
  const ordersQuery = useGetAdminOrdersQuery(
    {
      page: orderPage,
      page_size: orderPageSize,
      search: orderSearch || undefined,
      external_ref: orderExternalRefFilter || undefined,
      ordering: orderSort,
      status: orderStatusFilter === "all" ? undefined : orderStatusFilter,
      payment_status:
        orderPaymentStatusFilter === "all" ? undefined : orderPaymentStatusFilter,
      delivery_method:
        orderDeliveryMethodFilter === "all" ? undefined : orderDeliveryMethodFilter,
      date_from: orderDateFrom || undefined,
      date_to: orderDateTo || undefined,
    },
    { skip: activeTab !== "orders" },
  );
  const contentQuery = useGetAdminContentQuery(undefined, {
    skip: activeTab !== "content",
  });
  const homeTitleQuery = useGetAdminHomeTitleQuery(undefined, {
    skip: activeTab !== "content",
  });
  const aboutPageQuery = useGetAdminAboutPageQuery(undefined, {
    skip: activeTab !== "content",
  });
  const categoriesQuery = useGetAdminCategoriesQuery(undefined, {
    skip: activeTab !== "products" && activeTab !== "discounts" && !isProductModalOpen,
  });
  const usersQuery = useGetAdminUsersQuery(
    activeTab === "activity"
      ? { page: 1, page_size: 100 }
      : {
          page: userPage,
          page_size: userPageSize,
          search: userSearch || undefined,
          ordering: userSort,
          role: userRoleFilter === "all" ? undefined : userRoleFilter,
          is_active:
            userActiveFilter === "all"
              ? undefined
              : userActiveFilter === "active",
        },
    { skip: activeTab !== "users" && activeTab !== "activity" },
  );
  const rolesQuery = useGetAdminRolesQuery(undefined, {
    skip: activeTab !== "users",
  });
  const permissionsQuery = useGetAdminPermissionsQuery(undefined, {
    skip: activeTab !== "users",
  });
  const activityQuery = useGetAdminActivityQuery(
    {
      page: activityPage,
      page_size: 50,
      entity: activityEntityFilter === "all" ? undefined : activityEntityFilter,
    },
    { skip: activeTab !== "activity" },
  );
  const auditQuery = useGetAdminAuditQuery(
    {
      page: auditPage,
      page_size: 20,
      search: activitySearch || undefined,
      entity: activityEntityFilter === "all" ? undefined : activityEntityFilter,
      action: auditActionFilter || undefined,
      trace_id: auditTraceIdFilter || undefined,
      actor_id: auditActorIdFilter === "all" ? undefined : auditActorIdFilter,
    },
    { skip: activeTab !== "activity" },
  );

  const [postAdminProductMutation, { isLoading: isCreatingProduct }] =
    usePostAdminProductMutation();
  const [patchAdminProductMutation, { isLoading: isUpdatingProduct }] =
    usePatchAdminProductMutation();
  const [deleteAdminProductMutation, { isLoading: isDeletingProduct }] =
    useDeleteAdminProductMutation();
  const [postAdminProductImagesMutation, { isLoading: isUploadingProductImages }] =
    usePostAdminProductImagesMutation();
  const [patchAdminOrderStatusMutation, { isLoading: isUpdatingOrderStatus }] =
    usePatchAdminOrderStatusMutation();
  const [patchAdminHomeTitleMutation, { isLoading: isSavingHomeTitle }] =
    usePatchAdminHomeTitleMutation();
  const [patchAdminAboutPageMutation, { isLoading: isSavingAboutPage }] =
    usePatchAdminAboutPageMutation();
  const [uploadAdminAboutImageMutation] = useUploadAdminAboutImageMutation();
  const [postAdminRoleMutation, { isLoading: isCreatingRole }] = usePostAdminRoleMutation();
  const [patchAdminRoleMutation, { isLoading: isUpdatingRole }] = usePatchAdminRoleMutation();
  const [deleteAdminRoleMutation, { isLoading: isDeletingRole }] = useDeleteAdminRoleMutation();
  const [patchAdminUserRolesMutation, { isLoading: isUpdatingUserRoles }] =
    usePatchAdminUserRolesMutation();

  const isSavingProduct =
    isCreatingProduct || isUpdatingProduct || isUploadingProductImages;
  const isProductMutationLoading = isSavingProduct || isDeletingProduct;
  const isRoleMutationLoading = isCreatingRole || isUpdatingRole || isDeletingRole;

  const dashboard = dashboardQuery.data ?? {
    generated_at: new Date().toISOString(),
    range,
    currency: "KGS",
    kpis: [],
    revenue_series: [],
    top_products: [],
    low_stock: [],
    recent_orders: [],
  };
  const financeSummary = financeQuery.data ?? {
    period_start: "",
    period_end: "",
    currency: "KGS",
    product_revenue: 0,
    gross_revenue: 0,
    net_revenue: 0,
    discount_total: 0,
    delivery_income: 0,
    refund_total: 0,
    expenses_total: 0,
    cost_of_goods_sold: 0,
    profit: 0,
    average_order_value: 0,
    paid_orders: 0,
    failed_orders: 0,
  };
  const products = productsQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const inventory = inventoryQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const inventoryMovements = inventoryMovementsQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const contentProducts = contentProductsQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const orders = ordersQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const sections = contentQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const users = usersQuery.data ?? { count: 0, next: null, previous: null, results: [] };
  const roles = rolesQuery.data ?? [];
  const permissionCatalog = permissionsQuery.data ?? [];
  const activities = activityQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const auditLogs = auditQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const activityActors = useMemo(
    () =>
      users.results.map((userItem) => ({
        id: userItem.id,
        label:
          [userItem.first_name, userItem.last_name].filter(Boolean).join(" ").trim() ||
          userItem.email,
      })),
    [users.results],
  );

  useEffect(() => {
    if (!homeTitleQuery.data) {
      return;
    }

    setHomeTitleForm({
      made: homeTitleQuery.data.made || "",
      title: homeTitleQuery.data.title || "",
      clothes1_id: homeTitleQuery.data.clothes_ids?.[0]
        ? String(homeTitleQuery.data.clothes_ids[0])
        : "",
      clothes2_id: homeTitleQuery.data.clothes_ids?.[1]
        ? String(homeTitleQuery.data.clothes_ids[1])
        : "",
      clothes3_id: homeTitleQuery.data.clothes_ids?.[2]
        ? String(homeTitleQuery.data.clothes_ids[2])
        : "",
    });
  }, [homeTitleQuery.data]);

  useEffect(() => {
    if (!aboutPageQuery.data) {
      return;
    }

    setAboutPageForm({
      title: aboutPageQuery.data.title || "",
      made: aboutPageQuery.data.made || "",
      logo: aboutPageQuery.data.logo || "",
      blocks:
        aboutPageQuery.data.blocks.length > 0
          ? aboutPageQuery.data.blocks.map((block, index) => ({
              title: block.title || "",
              text: block.text || "",
              img: block.img || "",
              sort_order: String(block.sort_order || index + 1),
            }))
          : createEmptyAboutPageForm().blocks,
    });
  }, [aboutPageQuery.data]);

  useEffect(() => {
    if (activeTab !== "discounts") {
      return;
    }

    setDiscountDrafts(
      Object.fromEntries(
        products.results.map((product) => [product.id, toStringOrEmpty(product.discount_price)]),
      ),
    );
  }, [activeTab, products.results]);

  const activeQueryError =
    (activeTab === "dashboard"
      ? dashboardQuery.error || financeQuery.error
      : activeTab === "products"
        ? productsQuery.error || inventoryQuery.error || inventoryMovementsQuery.error
        : activeTab === "discounts"
        ? productsQuery.error
        : activeTab === "orders"
          ? ordersQuery.error
        : activeTab === "content"
            ? contentQuery.error ||
              homeTitleQuery.error ||
              aboutPageQuery.error ||
              contentProductsQuery.error
            : activeTab === "users"
              ? usersQuery.error || rolesQuery.error || permissionsQuery.error
              : usersQuery.error || activityQuery.error || auditQuery.error) as {
                  status?: unknown;
                }
              | undefined;
  const activeErrorStatus =
    typeof activeQueryError?.status === "number"
      ? activeQueryError.status
      : null;
  const isAccessDenied =
    activeErrorStatus === 401 ||
    activeErrorStatus === 403 ||
    Boolean(currentUser && !canAccessAdmin);
  const activeQueryMessage =
    !isAccessDenied && activeQueryError
      ? getApiUiMessage(
          activeQueryError,
          "Не удалось загрузить данные раздела.",
          "Слишком много запросов к админке. Попробуйте позже.",
        )
      : null;
  const isActiveTabLoading =
    activeTab === "dashboard"
      ? dashboardQuery.isLoading || financeQuery.isLoading
      : activeTab === "products"
        ? productsQuery.isLoading || inventoryQuery.isLoading || inventoryMovementsQuery.isLoading
        : activeTab === "discounts"
          ? productsQuery.isLoading || categoriesQuery.isLoading
          : activeTab === "orders"
            ? ordersQuery.isLoading
            : activeTab === "content"
              ? contentQuery.isLoading ||
                homeTitleQuery.isLoading ||
                aboutPageQuery.isLoading ||
                contentProductsQuery.isLoading
              : activeTab === "users"
                ? usersQuery.isLoading || rolesQuery.isLoading || permissionsQuery.isLoading
                : activityQuery.isLoading || auditQuery.isLoading || usersQuery.isLoading;
  const canRenderActiveTabContent = !isActiveTabLoading && !activeQueryMessage;

  const handleRetryActiveTab = () => {
    if (activeTab === "dashboard") {
      void dashboardQuery.refetch();
      void financeQuery.refetch();
      return;
    }

    if (activeTab === "products") {
      void productsQuery.refetch();
      void inventoryQuery.refetch();
      void inventoryMovementsQuery.refetch();
      return;
    }

    if (activeTab === "discounts") {
      void productsQuery.refetch();
      void categoriesQuery.refetch();
      return;
    }

    if (activeTab === "orders") {
      void ordersQuery.refetch();
      return;
    }

    if (activeTab === "content") {
      void contentQuery.refetch();
      void homeTitleQuery.refetch();
      void aboutPageQuery.refetch();
      void contentProductsQuery.refetch();
      return;
    }

    if (activeTab === "users") {
      void usersQuery.refetch();
      void rolesQuery.refetch();
      void permissionsQuery.refetch();
      return;
    }

    void usersQuery.refetch();
    void activityQuery.refetch();
    void auditQuery.refetch();
  };

  useEffect(() => {
    if (!visibleNavItems.length) {
      return;
    }

    if (!visibleNavItems.some((item) => item.key === activeTab)) {
      setActiveTab(visibleNavItems[0].key);
      setSearch("");
    }
  }, [activeTab, visibleNavItems]);

  const maxRevenue = Math.max(
    ...dashboard.revenue_series.map((item) => item.revenue),
    1,
  );

  const filteredProducts = useMemo(
    () => products.results,
    [products.results],
  );
  const discountSummary = useMemo(() => {
    const discountedProducts = filteredProducts.filter((product) => getDiscountPercent(product) > 0);
    const riskyProducts = filteredProducts.filter(
      (product) => getEffectiveProductPrice(product) <= product.cost_price,
    );
    const averageDiscount =
      discountedProducts.length > 0
        ? Number(
            (
              discountedProducts.reduce((sum, product) => sum + getDiscountPercent(product), 0) /
              discountedProducts.length
            ).toFixed(1),
          )
        : 0;

    return {
      total_products: filteredProducts.length,
      discounted_products: discountedProducts.length,
      risky_products: riskyProducts.length,
      average_discount_percent: averageDiscount,
    };
  }, [filteredProducts]);
  const filteredOrders = useMemo(
    () => orders.results,
    [orders.results],
  );

  const handleRangeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRange(event.target.value as AdminDateRange);
  };
  const defaultCategoryId = categories[0]?.id ?? 1;

  const resetProductImageSelection = () => {
    setProductImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setProductImageFiles([]);
  };

  const handleProductImageFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const extension = file.name.includes(".")
        ? file.name.split(".").pop()?.toLowerCase() || ""
        : "";

      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: файл не является изображением`);
        return;
      }

      if (!extension || !ALLOWED_PRODUCT_IMAGE_EXTENSIONS.has(extension)) {
        errors.push(
          `${file.name}: неподдерживаемый формат (используйте svg, jpg, jpeg, png, webp, gif, jfif, avif)`,
        );
        return;
      }

      if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
        errors.push(`${file.name}: файл больше ${MAX_PRODUCT_IMAGE_SIZE_MB} МБ`);
        return;
      }

      validFiles.push(file);
    });

    resetProductImageSelection();

    if (!validFiles.length) {
      setMessage({
        type: "error",
        text: errors[0] || "Не выбрано ни одного подходящего изображения.",
      });
      return;
    }

    setProductImageFiles(validFiles);
    setProductImagePreviews(validFiles.map((file) => URL.createObjectURL(file)));

    if (errors.length) {
      setMessage({
        type: "error",
        text: `${errors[0]}${errors.length > 1 ? ` (+ ещё ${errors.length - 1})` : ""}`,
      });
    }
  };

  const openCreateProductModal = () => {
    if (!canManageProducts) {
      return;
    }
    setProductModalMode("create");
    setSelectedProduct(null);
    setProductForm(createEmptyProductForm(defaultCategoryId));
    resetProductImageSelection();
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: AdminProduct) => {
    if (!canManageProducts) {
      return;
    }
    setProductModalMode("edit");
    setSelectedProduct(product);
    setProductForm(productToForm(product));
    resetProductImageSelection();
    setIsProductModalOpen(true);
  };

  const openDeleteProductModal = (product: AdminProduct) => {
    if (!canDeleteProducts) {
      return;
    }
    setProductModalMode("delete");
    setSelectedProduct(product);
    setProductForm(productToForm(product));
    resetProductImageSelection();
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    if (isProductMutationLoading) {
      return;
    }

    setIsProductModalOpen(false);
    setSelectedProduct(null);
    resetProductImageSelection();
  };

  const handleProductFieldChange = (
    field: keyof ProductFormState,
    value: string | boolean,
  ) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openOrderDetailsModal = (order: AdminOrder) => {
    setSelectedOrder(order);
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrder(null);
  };

  const handleDiscountDraftChange = (productId: number, value: string) => {
    if (!canManageDiscounts) {
      return;
    }
    setDiscountDrafts((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const applyDiscountPreset = (product: AdminProduct, percent: number) => {
    if (!canManageDiscounts) {
      return;
    }
    const nextPrice = product.base_price * (1 - percent / 100);
    handleDiscountDraftChange(product.id, String(Math.max(Number(nextPrice.toFixed(2)), 0)));
  };

  const resetDiscountDraft = (productId: number) => {
    if (!canManageDiscounts) {
      return;
    }
    handleDiscountDraftChange(productId, "");
  };

  const handleHomeTitleFieldChange = (
    field: keyof HomeTitleFormState,
    value: string,
  ) => {
    setHomeTitleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHomeTitleSave = async () => {
    if (!canManageContent) {
      return;
    }
    setMessage(null);

    if (!homeTitleForm.made.trim() || !homeTitleForm.title.trim()) {
      setMessage({
        type: "error",
        text: "Заполните подзаголовок и заголовок главного баннера.",
      });
      return;
    }

    const clothesIds = [
      Number(homeTitleForm.clothes1_id),
      Number(homeTitleForm.clothes2_id),
      Number(homeTitleForm.clothes3_id),
    ].filter((item) => Number.isInteger(item) && item > 0);

    if (clothesIds.length !== 3 || new Set(clothesIds).size !== 3) {
      setMessage({
        type: "error",
        text: "Выберите 3 разных товара для главного баннера.",
      });
      return;
    }

    try {
      await patchAdminHomeTitleMutation({
        data: {
          made: homeTitleForm.made.trim(),
          title: homeTitleForm.title.trim(),
          clothes_ids: clothesIds,
        },
      }).unwrap();

      setMessage({
        type: "success",
        text: "Главный баннер обновлен.",
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось обновить главный баннер."));
    }
  };

  const handleAboutPageFieldChange = (
    field: keyof Omit<AboutPageFormState, "blocks">,
    value: string,
  ) => {
    setAboutPageForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAboutBlockFieldChange = (
    index: number,
    field: keyof AboutBlockFormState,
    value: string,
  ) => {
    setAboutPageForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              [field]: value,
            }
          : block,
      ),
    }));
  };

  const handleAddAboutBlock = () => {
    if (!canManageContent) {
      return;
    }
    setAboutPageForm((prev) => ({
      ...prev,
      blocks: [...prev.blocks, createEmptyAboutBlockForm(prev.blocks.length + 1)],
    }));
  };

  const handleRemoveAboutBlock = (index: number) => {
    if (!canManageContent) {
      return;
    }
    setAboutPageForm((prev) => {
      if (prev.blocks.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        blocks: prev.blocks
          .filter((_, blockIndex) => blockIndex !== index)
          .map((block, blockIndex) => ({
            ...block,
            sort_order: String(blockIndex + 1),
          })),
      };
    });
  };

  const handleAboutPageSave = async () => {
    if (!canManageContent) {
      return;
    }
    const title = aboutPageForm.title.trim();
    const made = aboutPageForm.made.trim();
    const logo = aboutPageForm.logo.trim();
    const blocks = aboutPageForm.blocks
      .map((block, index) => ({
        title: block.title.trim(),
        text: block.text.trim(),
        img: block.img.trim(),
        sort_order: Number(block.sort_order) > 0 ? Number(block.sort_order) : index + 1,
      }))
      .sort((left, right) => left.sort_order - right.sort_order);

    if (!title || !made) {
      setMessage({
        type: "error",
        text: "Для страницы «О нас» заполните заголовок и подзаголовок.",
      });
      return;
    }

    if (!blocks.length || blocks.some((block) => !block.title || !block.text)) {
      setMessage({
        type: "error",
        text: "У каждого блока страницы «О нас» должны быть заголовок и текст.",
      });
      return;
    }

    setMessage(null);

    try {
      const saved = await patchAdminAboutPageMutation({
        data: {
          title,
          made,
          logo,
          blocks,
        },
      }).unwrap();

      setAboutPageForm({
        title: saved.title,
        made: saved.made,
        logo: saved.logo,
        blocks: saved.blocks.map((block, index) => ({
          title: block.title,
          text: block.text,
          img: block.img,
          sort_order: String(block.sort_order || index + 1),
        })),
      });

      setMessage({
        type: "success",
        text: "Страница «О нас» успешно обновлена.",
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось сохранить страницу «О нас»."));
    }
  };

  const handleAboutBlockImageUpload = async (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!canManageContent) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || ""
      : "";

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: `${file.name}: файл не является изображением.`,
      });
      return;
    }

    if (!extension || !ALLOWED_PRODUCT_IMAGE_EXTENSIONS.has(extension)) {
      setMessage({
        type: "error",
        text: `${file.name}: неподдерживаемый формат. Используйте svg, jpg, jpeg, png, webp, gif, jfif, avif.`,
      });
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      setMessage({
        type: "error",
        text: `${file.name}: файл больше ${MAX_PRODUCT_IMAGE_SIZE_MB} МБ.`,
      });
      return;
    }

    setMessage(null);
    setAboutUploadingBlockIndex(index);

    try {
      const uploaded = await uploadAdminAboutImageMutation({ file }).unwrap();
      handleAboutBlockFieldChange(index, "img", uploaded.image);
      setMessage({
        type: "success",
        text: `Изображение для блока ${index + 1} загружено.`,
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось загрузить изображение блока."));
    } finally {
      setAboutUploadingBlockIndex(null);
    }
  };

  const handleAboutHeroImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canManageContent) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || ""
      : "";

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: `${file.name}: файл не является изображением.`,
      });
      return;
    }

    if (!extension || !ALLOWED_PRODUCT_IMAGE_EXTENSIONS.has(extension)) {
      setMessage({
        type: "error",
        text: `${file.name}: неподдерживаемый формат. Используйте svg, jpg, jpeg, png, webp, gif, jfif, avif.`,
      });
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      setMessage({
        type: "error",
        text: `${file.name}: файл больше ${MAX_PRODUCT_IMAGE_SIZE_MB} МБ.`,
      });
      return;
    }

    setMessage(null);
    setAboutUploadingHero(true);

    try {
      const uploaded = await uploadAdminAboutImageMutation({ file }).unwrap();
      handleAboutPageFieldChange("logo", uploaded.image);
      setMessage({
        type: "success",
        text: "Hero-изображение страницы «О нас» загружено.",
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось загрузить hero-изображение."));
    } finally {
      setAboutUploadingHero(false);
    }
  };

  const handleProductSave = async () => {
    if (!canManageProducts) {
      return;
    }
    setMessage(null);
    const sizes = parseCsv(productForm.sizes);
    const colors = parseCsv(productForm.colors);
    const promoCategories = parseCsv(productForm.promo_categories);
    const currentSizes = selectedProduct
      ? Array.from(new Set(selectedProduct.variants.map((item) => item.size)))
      : [];
    const currentColors = selectedProduct
      ? Array.from(new Set(selectedProduct.variants.map((item) => item.color)))
      : [];
    const basePrice = Number(productForm.base_price);
    const costPrice = Number(productForm.cost_price);
    const discountRaw = productForm.discount_price.trim();
    const discountPrice = discountRaw.length ? Number(discountRaw) : null;
    const shouldUpdateVariants =
      productModalMode === "create"
        ? true
        : hasDifferentListValues(sizes, currentSizes) ||
          hasDifferentListValues(colors, currentColors);

    if (!productForm.name.trim() || !productForm.description.trim()) {
      setMessage({ type: "error", text: "Заполните название и описание товара." });
      return;
    }

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setMessage({ type: "error", text: "Базовая цена должна быть больше 0." });
      return;
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      setMessage({ type: "error", text: "Себестоимость не может быть отрицательной." });
      return;
    }

    if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice <= 0)) {
      setMessage({ type: "error", text: "Цена со скидкой должна быть больше 0." });
      return;
    }

    if (shouldUpdateVariants && (!sizes.length || !colors.length)) {
      setMessage({
        type: "error",
        text: "Добавьте хотя бы один размер и один цвет через запятую.",
      });
      return;
    }

    const basePayload: Omit<AdminProductPayload, "sizes" | "colors"> = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      category_id: Number(productForm.category_id) || defaultCategoryId,
      textile_name: productForm.textile_name.trim() || "Tafeta",
      active: productForm.active,
      base_price: basePrice,
      cost_price: costPrice,
      discount_price: discountPrice,
      promo_categories: promoCategories,
    };

    try {
      let targetProductId = selectedProduct?.id ?? null;

      if (productModalMode === "create") {
        const payload: AdminProductPayload = {
          ...basePayload,
          sizes,
          colors,
        };
        const created = await postAdminProductMutation(payload).unwrap();
        targetProductId = created.id;
      } else if (productModalMode === "edit" && selectedProduct) {
        const patchPayload: Partial<AdminProductPayload> = {
          ...basePayload,
        };
        if (shouldUpdateVariants) {
          patchPayload.sizes = sizes;
          patchPayload.colors = colors;
        }
        const updated = await patchAdminProductMutation({
          id: selectedProduct.id,
          data: patchPayload,
        }).unwrap();
        targetProductId = updated.id;
      }

      if (targetProductId && productImageFiles.length) {
        await postAdminProductImagesMutation({
          id: targetProductId,
          files: productImageFiles,
          colors: colors.length ? colors : undefined,
          replace_existing: true,
        }).unwrap();
      }

      setMessage({
        type: "success",
        text:
          productModalMode === "create"
            ? "Товар успешно создан."
            : "Товар успешно обновлен.",
      });

      closeProductModal();
    } catch (error) {
      setMessage(
        getApiUiMessage(
          error,
          "Не удалось сохранить товар. Проверьте данные и права доступа.",
        ),
      );
    }
  };

  const handleDiscountSave = async (product: AdminProduct) => {
    if (!canManageDiscounts) {
      return;
    }
    const rawValue = discountDrafts[product.id]?.trim() ?? "";
    const discountPrice = rawValue.length ? Number(rawValue) : null;

    if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice <= 0)) {
      setMessage({ type: "error", text: "Цена со скидкой должна быть больше 0." });
      return;
    }

    if (discountPrice !== null && discountPrice >= product.base_price) {
      setMessage({
        type: "error",
        text: `Цена со скидкой для "${product.name}" должна быть ниже базовой цены.`,
      });
      return;
    }

    setMessage(null);
    setDiscountSavingId(product.id);

    try {
      await patchAdminProductMutation({
        id: product.id,
        data: {
          discount_price: discountPrice,
        },
      }).unwrap();

      setMessage({
        type: "success",
        text:
          discountPrice === null
            ? `Скидка для "${product.name}" удалена.`
            : `Скидка для "${product.name}" обновлена.`,
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось обновить скидку."));
    } finally {
      setDiscountSavingId(null);
    }
  };

  const handleProductDelete = async () => {
    if (!canDeleteProducts) {
      return;
    }
    if (!selectedProduct) {
      return;
    }

    setMessage(null);
    try {
      await deleteAdminProductMutation(selectedProduct.id).unwrap();
      setMessage({
        type: "success",
        text: `Товар "${selectedProduct.name}" удален.`,
      });
      closeProductModal();
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось удалить товар."));
    }
  };

  const handleOrderStatusChange = async (
    id: number,
    status: AdminOrderStatus,
  ) => {
    if (!canManageOrders) {
      return;
    }
    setMessage(null);
    try {
      const updatedOrder = await patchAdminOrderStatusMutation({ id, status }).unwrap();
      if (selectedOrder?.id === id) {
        setSelectedOrder(updatedOrder);
      }
      setMessage({
        type: "success",
        text: `Статус заказа ${updatedOrder.order_number} изменен: ${STATUS_LABELS[normalizeWorkflowStatus(updatedOrder.status)]}.`,
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось обновить статус заказа."));
    }
  };

  const handleCreateRole = async (data: IADMIN.PostRoleReq) => {
    if (!canManageUsers) {
      return;
    }

    setMessage(null);
    try {
      const createdRole = await postAdminRoleMutation(data).unwrap();
      setMessage({
        type: "success",
        text: `Роль «${createdRole.name}» создана.`,
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось создать роль."));
      throw error;
    }
  };

  const handleUpdateRole = async (id: number, data: IADMIN.PatchRoleReq["data"]) => {
    if (!canManageUsers) {
      return;
    }

    setMessage(null);
    try {
      const updatedRole = await patchAdminRoleMutation({ id, data }).unwrap();
      setMessage({
        type: "success",
        text: `Роль «${updatedRole.name}» обновлена.`,
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось обновить роль."));
      throw error;
    }
  };

  const handleDeleteRole = async (role: AdminRbacRole) => {
    if (!canManageUsers) {
      return;
    }

    setMessage(null);
    try {
      await deleteAdminRoleMutation(role.id).unwrap();
      setMessage({
        type: "success",
        text: `Роль «${role.name}» удалена.`,
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось удалить роль."));
      throw error;
    }
  };

  const handleUserRolesUpdate = async (userItem: AdminUser, roleKeys: string[]) => {
    if (!canManageUsers) {
      return;
    }

    setMessage(null);
    try {
      await patchAdminUserRolesMutation({
        id: userItem.id,
        role_keys: roleKeys,
      }).unwrap();
      setMessage({
        type: "success",
        text: `Права пользователя ${userItem.email} обновлены.`,
      });
    } catch (error) {
      setMessage(getApiUiMessage(error, "Не удалось обновить роли пользователя."));
      throw error;
    }
  };

  if (isAccessDenied) {
    return (
      <section className={scss.AdminPanel}>
        <div className={scss.shell}>
          <div className={scss.main}>
            <header className={scss.topBar}>
              <div>
                <h1>Панель управления сайтом</h1>
                <p>Недостаточно прав для доступа к админ-панели.</p>
              </div>
            </header>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={scss.AdminPanel}>
      <div className={scss.shell}>
        <aside className={scss.sidebar}>
          <h2>Jumana Админ</h2>
          <ul>
            {visibleNavItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={activeTab === item.key ? scss.active : ""}
                  onClick={() => {
                    setActiveTab(item.key);
                    setSearch("");
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className={scss.main}>
          <header className={scss.topBar}>
            <div>
              <h1>Панель управления сайтом</h1>
              <p>Товары, заказы, контент и аналитика в одном месте.</p>
            </div>
            <div className={scss.topActions}>
                <select value={range} onChange={handleRangeChange}>
                {RANGE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {RANGE_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </header>

            {message && (
              <div
                className={`${scss.message} ${message.type === "success" ? scss.success : scss.error}`}
              >
                <div>{message.text}</div>
                {message.traceId ? (
                  <div className={scss.messageTrace}>ID запроса: {message.traceId}</div>
                ) : null}
              </div>
            )}

          {isActiveTabLoading && (
            <div className={scss.panel}>
              <div className={scss.statePanel}>
                <h2>Загрузка раздела</h2>
                <p>Получаем актуальные данные. Это может занять несколько секунд.</p>
              </div>
            </div>
          )}

          {activeQueryMessage && (
            <div className={scss.panel}>
              <div className={scss.statePanel}>
                <h2>Не удалось загрузить раздел</h2>
                <p>{activeQueryMessage.text}</p>
                {activeQueryMessage.traceId ? (
                  <p className={scss.stateTrace}>ID запроса: {activeQueryMessage.traceId}</p>
                ) : null}
                <div className={scss.stateActions}>
                  <button type="button" className={scss.secondaryAction} onClick={handleRetryActiveTab}>
                    Повторить
                  </button>
                </div>
              </div>
            </div>
          )}

          {canRenderActiveTabContent && activeTab === "dashboard" && (
            <AdminDashboardSection
              dashboard={dashboard}
              financeSummary={financeSummary}
              maxRevenue={maxRevenue}
            />
          )}

            {canRenderActiveTabContent && activeTab === "products" && (
              <>
                <AdminProductsSection
                  products={filteredProducts}
                  categories={categories}
                  totalCount={products.count}
                  currentPage={productPage}
                  pageSize={productPageSize}
                  hasNextPage={Boolean(products.next)}
                  hasPreviousPage={Boolean(products.previous)}
                  search={productSearch}
                  sorting={productSort}
                  categoryFilter={productCategoryFilter}
                  activeFilter={productActiveFilter}
                  canManageProducts={canManageProducts}
                  canDeleteProducts={canDeleteProducts}
                  onSearchChange={(value) => {
                    setProductSearch(value);
                    setProductPage(1);
                  }}
                  onSortChange={(value) => {
                    setProductSort(value);
                    setProductPage(1);
                  }}
                  onCategoryFilterChange={(value) => {
                    setProductCategoryFilter(value);
                    setProductPage(1);
                  }}
                  onActiveFilterChange={(value) => {
                    setProductActiveFilter(value);
                    setProductPage(1);
                  }}
                  onPageChange={setProductPage}
                  onPageSizeChange={(value) => {
                    setProductPageSize(value as (typeof PRODUCT_PAGE_SIZE_OPTIONS)[number]);
                    setProductPage(1);
                  }}
                  onResetFilters={() => {
                    setProductSearch("");
                    setProductSort("-updated_at");
                    setProductCategoryFilter("all");
                    setProductActiveFilter("all");
                    setProductPage(1);
                    setProductPageSize(20);
                  }}
                  onCreateProduct={openCreateProductModal}
                  onEditProduct={openEditProductModal}
                  onDeleteProduct={openDeleteProductModal}
                />
                <AdminInventorySection
                  inventory={inventory}
                  movements={inventoryMovements}
                  lowStockOnly={inventoryLowStockOnly}
                  selectedMovementType={inventoryMovementType}
                  selectedInventoryItem={selectedInventoryItem}
                  onToggleLowStock={() => setInventoryLowStockOnly((prev) => !prev)}
                  onSelectMovementType={setInventoryMovementType}
                  onSelectInventoryItem={setSelectedInventoryItem}
                  onClearMovementFilters={() => {
                    setSelectedInventoryItem(null);
                    setInventoryMovementType("all");
                  }}
                />
              </>
            )}

          {canRenderActiveTabContent && activeTab === "discounts" && (
            <AdminDiscountsSection
              filteredProducts={filteredProducts}
              categories={categories}
              totalCount={products.count}
              currentPage={discountPage}
              pageSize={discountPageSize}
              hasNextPage={Boolean(products.next)}
              hasPreviousPage={Boolean(products.previous)}
              search={discountSearch}
              sorting={discountSort}
              categoryFilter={discountCategoryFilter}
              activeFilter={discountActiveFilter}
              canManageDiscounts={canManageDiscounts}
              discountSummary={discountSummary}
              discountDrafts={discountDrafts}
              discountSavingId={discountSavingId}
              onSearchChange={(value) => {
                setDiscountSearch(value);
                setDiscountPage(1);
              }}
              onSortChange={(value) => {
                setDiscountSort(value);
                setDiscountPage(1);
              }}
              onCategoryFilterChange={(value) => {
                setDiscountCategoryFilter(value);
                setDiscountPage(1);
              }}
              onActiveFilterChange={(value) => {
                setDiscountActiveFilter(value);
                setDiscountPage(1);
              }}
              onPageChange={setDiscountPage}
              onPageSizeChange={(value) => {
                setDiscountPageSize(value as (typeof DISCOUNT_PAGE_SIZE_OPTIONS)[number]);
                setDiscountPage(1);
              }}
              onResetFilters={() => {
                setDiscountSearch("");
                setDiscountSort("-updated_at");
                setDiscountCategoryFilter("all");
                setDiscountActiveFilter("all");
                setDiscountPage(1);
                setDiscountPageSize(20);
              }}
              onDiscountDraftChange={handleDiscountDraftChange}
              onApplyDiscountPreset={applyDiscountPreset}
              onResetDiscountDraft={resetDiscountDraft}
              onSaveDiscount={handleDiscountSave}
            />
          )}

          {canRenderActiveTabContent && activeTab === "orders" && (
            <AdminOrdersSection
              filteredOrders={filteredOrders}
              totalCount={orders.count}
              currentPage={orderPage}
              pageSize={orderPageSize}
              hasNextPage={Boolean(orders.next)}
              hasPreviousPage={Boolean(orders.previous)}
              search={orderSearch}
              externalRefFilter={orderExternalRefFilter}
              ordering={orderSort}
              statusFilter={orderStatusFilter}
              paymentStatusFilter={orderPaymentStatusFilter}
              deliveryMethodFilter={orderDeliveryMethodFilter}
              dateFrom={orderDateFrom}
              dateTo={orderDateTo}
              canManageOrders={canManageOrders}
              isUpdatingOrderStatus={isUpdatingOrderStatus}
              onSearchChange={(value) => {
                setOrderSearch(value);
                setOrderPage(1);
              }}
              onExternalRefFilterChange={(value) => {
                setOrderExternalRefFilter(value);
                setOrderPage(1);
              }}
              onOrderingChange={(value) => {
                setOrderSort(value);
                setOrderPage(1);
              }}
              onStatusFilterChange={(value) => {
                setOrderStatusFilter(value);
                setOrderPage(1);
              }}
              onPaymentStatusFilterChange={(value) => {
                setOrderPaymentStatusFilter(value);
                setOrderPage(1);
              }}
              onDeliveryMethodFilterChange={(value) => {
                setOrderDeliveryMethodFilter(value);
                setOrderPage(1);
              }}
              onDateFromChange={(value) => {
                setOrderDateFrom(value);
                setOrderPage(1);
              }}
              onDateToChange={(value) => {
                setOrderDateTo(value);
                setOrderPage(1);
              }}
              onResetFilters={() => {
                setOrderSearch("");
                setOrderExternalRefFilter("");
                setOrderSort("newest");
                setOrderStatusFilter("all");
                setOrderPaymentStatusFilter("all");
                setOrderDeliveryMethodFilter("all");
                setOrderDateFrom("");
                setOrderDateTo("");
                setOrderPage(1);
              }}
              onPageChange={setOrderPage}
              onPageSizeChange={(value) => {
                setOrderPageSize(value as (typeof ORDER_PAGE_SIZE_OPTIONS)[number]);
                setOrderPage(1);
              }}
              onOpenOrderDetails={openOrderDetailsModal}
              onChangeOrderStatus={handleOrderStatusChange}
            />
          )}
          {canRenderActiveTabContent && activeTab === "content" && (
            <AdminContentSection
              contentProducts={contentProducts}
              sections={sections}
              canManageContent={canManageContent}
              homeTitleForm={homeTitleForm}
              aboutPageForm={aboutPageForm}
              isSavingHomeTitle={isSavingHomeTitle}
              isSavingAboutPage={isSavingAboutPage}
              aboutUploadingHero={aboutUploadingHero}
              aboutUploadingBlockIndex={aboutUploadingBlockIndex}
              aboutHeroInputRef={aboutHeroInputRef}
              aboutBlockInputRefs={aboutBlockInputRefs}
              maxProductImageSizeMb={MAX_PRODUCT_IMAGE_SIZE_MB}
              onHomeTitleFieldChange={handleHomeTitleFieldChange}
              onHomeTitleSave={handleHomeTitleSave}
              onAboutPageFieldChange={handleAboutPageFieldChange}
              onAboutBlockFieldChange={handleAboutBlockFieldChange}
              onAddAboutBlock={handleAddAboutBlock}
              onRemoveAboutBlock={handleRemoveAboutBlock}
              onAboutPageSave={handleAboutPageSave}
              onAboutHeroImageUpload={handleAboutHeroImageUpload}
              onAboutBlockImageUpload={handleAboutBlockImageUpload}
            />
          )}

          {canRenderActiveTabContent && activeTab === "users" && (
            <AdminUsersSection
              users={users}
              roles={roles}
              permissions={permissionCatalog}
              search={userSearch}
              currentPage={userPage}
              pageSize={userPageSize}
              sorting={userSort}
              roleFilter={userRoleFilter}
              activeFilter={userActiveFilter}
              canManageUsers={canManageUsers}
              isRoleMutationLoading={isRoleMutationLoading}
              isUpdatingUserRoles={isUpdatingUserRoles}
              onSearchChange={(value) => {
                setUserSearch(value);
                setUserPage(1);
              }}
              onSortChange={(value) => {
                setUserSort(value);
                setUserPage(1);
              }}
              onRoleFilterChange={(value) => {
                setUserRoleFilter(value);
                setUserPage(1);
              }}
              onActiveFilterChange={(value) => {
                setUserActiveFilter(value);
                setUserPage(1);
              }}
              onPageChange={setUserPage}
              onPageSizeChange={(value) => {
                setUserPageSize(value as (typeof USER_PAGE_SIZE_OPTIONS)[number]);
                setUserPage(1);
              }}
              onResetListFilters={() => {
                setUserSearch("");
                setUserSort("newest");
                setUserRoleFilter("all");
                setUserActiveFilter("all");
                setUserPage(1);
                setUserPageSize(20);
              }}
              onCreateRole={handleCreateRole}
              onUpdateRole={handleUpdateRole}
              onDeleteRole={handleDeleteRole}
              onUpdateUserRoles={handleUserRolesUpdate}
            />
          )}

          {canRenderActiveTabContent && activeTab === "activity" && (
            <AdminActivitySection
              activities={activities}
              auditLogs={auditLogs}
              search={activitySearch}
              entityFilter={activityEntityFilter}
              actionFilter={auditActionFilter}
              traceIdFilter={auditTraceIdFilter}
              actorIdFilter={auditActorIdFilter}
              actorOptions={activityActors}
              activityPage={activityPage}
              activityPageSize={50}
              auditPage={auditPage}
              auditPageSize={20}
              onSearchChange={(value) => {
                setActivitySearch(value);
                setActivityPage(1);
                setAuditPage(1);
              }}
              onEntityFilterChange={(value) => {
                setActivityEntityFilter(value);
                setActivityPage(1);
                setAuditPage(1);
              }}
              onActionFilterChange={(value) => {
                setAuditActionFilter(value);
                setAuditPage(1);
              }}
              onTraceIdFilterChange={(value) => {
                setAuditTraceIdFilter(value);
                setAuditPage(1);
              }}
              onActorFilterChange={(value) => {
                setAuditActorIdFilter(value);
                setAuditPage(1);
              }}
              onActivityPageChange={setActivityPage}
              onAuditPageChange={setAuditPage}
              onResetFilters={() => {
                setActivitySearch("");
                setActivityEntityFilter("all");
                setAuditActionFilter("");
                setAuditTraceIdFilter("");
                setAuditActorIdFilter("all");
                setActivityPage(1);
                setAuditPage(1);
              }}
            />
          )}

          <AdminOrderDetailsModal
            selectedOrder={selectedOrder}
            canManageOrders={canManageOrders}
            isUpdatingOrderStatus={isUpdatingOrderStatus}
            onClose={closeOrderDetailsModal}
            onChangeOrderStatus={handleOrderStatusChange}
          />
          <AdminProductModal
            isOpen={isProductModalOpen}
            productModalMode={productModalMode}
            selectedProduct={selectedProduct}
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            productForm={productForm}
            productImagePreviews={productImagePreviews}
            productImageInputRef={productImageInputRef}
            canManageProducts={canManageProducts}
            canDeleteProducts={canDeleteProducts}
            isProductMutationLoading={isProductMutationLoading}
            isDeletingProduct={isDeletingProduct}
            isSavingProduct={isSavingProduct}
            onClose={closeProductModal}
            onDelete={handleProductDelete}
            onSave={handleProductSave}
            onFieldChange={handleProductFieldChange}
            onImageFilesChange={handleProductImageFilesChange}
          />
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;




