"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiBox,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  useGetAdminActivityQuery,
  useGetAdminCategoriesQuery,
  useGetAdminContentQuery,
  useGetAdminDashboardQuery,
  useGetAdminFinanceSummaryQuery,
  useGetAdminHomeTitleQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminUsersQuery,
  useDeleteAdminProductMutation,
  usePatchAdminHomeTitleMutation,
  usePatchAdminProductMutation,
  usePatchAdminOrderStatusMutation,
  usePostAdminProductMutation,
  usePostAdminProductImagesMutation,
} from "../../../../../redux/api/admin";
import scss from "./AdminPanel.module.scss";

type AdminTab =
  | "dashboard"
  | "products"
  | "orders"
  | "content"
  | "users"
  | "activity";

type ProductModalMode = "create" | "edit" | "delete";

type ProductFormState = {
  name: string;
  description: string;
  category_id: string;
  textile_name: string;
  active: boolean;
  base_price: string;
  discount_price: string;
  sizes: string;
  colors: string;
  promo_categories: string;
};

type HomeTitleFormState = {
  made: string;
  title: string;
  clothes1_id: string;
  clothes2_id: string;
  clothes3_id: string;
};

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

const readErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const messages = value.filter((item): item is string => typeof item === "string");
    if (messages.length) {
      return messages.join(", ");
    }
  }

  return null;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const data = (error as { data?: unknown }).data;
  if (data && typeof data === "object") {
    const nestedMessage = readErrorMessage((data as { message?: unknown }).message);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  const message = readErrorMessage((error as { message?: unknown }).message);
  return message || fallback;
};

const toStringOrEmpty = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

const resolveImageUrl = (value: string): string => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("blob:") || value.startsWith("data:")) {
    return value;
  }

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  return `${apiBaseUrl}${value}`;
};

const createEmptyProductForm = (defaultCategoryId: number): ProductFormState => ({
  name: "",
  description: "",
  category_id: String(defaultCategoryId),
  textile_name: "",
  active: true,
  base_price: "",
  discount_price: "",
  sizes: "S, M, L",
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
    base_price: toStringOrEmpty(firstVariant?.price ?? 0),
    discount_price: toStringOrEmpty(firstVariant?.discount_price ?? null),
    sizes: variantSizes.join(", "),
    colors: variantColors.join(", "),
    promo_categories: (product.promo_categories || []).join(", "),
  };
};

const NAV_ITEMS: Array<{ key: AdminTab; label: string; icon: ReactNode }> = [
  { key: "dashboard", label: "Аналитика", icon: <FiBarChart2 /> },
  { key: "products", label: "Товары", icon: <FiShoppingBag /> },
  { key: "orders", label: "Заказы", icon: <FiFileText /> },
  { key: "content", label: "Контент", icon: <FiBox /> },
  { key: "users", label: "Пользователи", icon: <FiUsers /> },
  { key: "activity", label: "События", icon: <FiActivity /> },
];

const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  placed: "Размещен",
  processing: "В обработке",
  packaging: "Сборка",
  shipping: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
  returned: "Возврат",
};

const RANGE_OPTIONS: AdminDateRange[] = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
];

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(value)} с`;
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const MOCK_ORDERS: AdminOrder[] = [
  {
    id: 1050486,
    order_number: "#1050486",
    customer_id: 51,
    customer_name: "Айгерим Н.",
    customer_phone: "+996 555 00-00-00",
    created_at: "2026-02-26T10:20:00.000Z",
    updated_at: "2026-02-27T13:10:00.000Z",
    status: "processing",
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
      },
    ],
  },
  {
    id: 1050487,
    order_number: "#1050487",
    customer_id: 77,
    customer_name: "Сабина К.",
    customer_phone: "+996 700 11-22-33",
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
      role: "customer",
      is_active: true,
      created_at: "2025-08-12T08:00:00.000Z",
      total_orders: 8,
      total_spent: 35200,
      last_order_at: "2026-02-27T13:10:00.000Z",
    },
    {
      id: 3,
      first_name: "Admin",
      last_name: "Manager",
      email: "manager@jumana.com",
      phone_number: "+996777001122",
      role: "manager",
      is_active: true,
      created_at: "2025-01-18T09:00:00.000Z",
      total_orders: 0,
      total_spent: 0,
      last_order_at: null,
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
  gross_revenue: 154000,
  net_revenue: 141900,
  discount_total: 9100,
  delivery_income: 3200,
  refund_total: 2600,
  expenses_total: 57800,
  profit: 84100,
  average_order_value: 1222,
  paid_orders: 116,
  failed_orders: 10,
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [range, setRange] = useState<AdminDateRange>("month");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [productModalMode, setProductModalMode] =
    useState<ProductModalMode>("create");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(
    createEmptyProductForm(1),
  );
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [homeTitleForm, setHomeTitleForm] = useState<HomeTitleFormState>(
    createEmptyHomeTitleForm(),
  );

  const dashboardQuery = useGetAdminDashboardQuery(
    { range },
    { skip: activeTab !== "dashboard" },
  );
  const financeQuery = useGetAdminFinanceSummaryQuery(
    { range },
    { skip: activeTab !== "dashboard" },
  );
  const productsQuery = useGetAdminProductsQuery(
    { page: 1, page_size: 50, search: search || undefined },
    { skip: activeTab !== "products" },
  );
  const contentProductsQuery = useGetAdminProductsQuery(
    { page: 1, page_size: 200 },
    { skip: activeTab !== "content" },
  );
  const ordersQuery = useGetAdminOrdersQuery(
    { page: 1, page_size: 50, search: search || undefined },
    { skip: activeTab !== "orders" },
  );
  const contentQuery = useGetAdminContentQuery(undefined, {
    skip: activeTab !== "content",
  });
  const homeTitleQuery = useGetAdminHomeTitleQuery(undefined, {
    skip: activeTab !== "content",
  });
  const categoriesQuery = useGetAdminCategoriesQuery(undefined, {
    skip: activeTab !== "products",
  });
  const usersQuery = useGetAdminUsersQuery(
    { page: 1, page_size: 50, search: search || undefined },
    { skip: activeTab !== "users" },
  );
  const activityQuery = useGetAdminActivityQuery(
    { page: 1, page_size: 50 },
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
  const [patchAdminOrderStatusMutation] = usePatchAdminOrderStatusMutation();
  const [patchAdminHomeTitleMutation, { isLoading: isSavingHomeTitle }] =
    usePatchAdminHomeTitleMutation();

  const isSavingProduct =
    isCreatingProduct || isUpdatingProduct || isUploadingProductImages;
  const isProductMutationLoading = isSavingProduct || isDeletingProduct;

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
    gross_revenue: 0,
    net_revenue: 0,
    discount_total: 0,
    delivery_income: 0,
    refund_total: 0,
    expenses_total: 0,
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
  const activities = activityQuery.data ?? {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };

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

  const activeQueryError =
    (activeTab === "dashboard"
      ? dashboardQuery.error || financeQuery.error
      : activeTab === "products"
        ? productsQuery.error
        : activeTab === "orders"
          ? ordersQuery.error
          : activeTab === "content"
            ? contentQuery.error || homeTitleQuery.error || contentProductsQuery.error
            : activeTab === "users"
              ? usersQuery.error
              : activityQuery.error) as { status?: unknown } | undefined;
  const activeErrorStatus =
    typeof activeQueryError?.status === "number"
      ? activeQueryError.status
      : null;
  const isAccessDenied = activeErrorStatus === 401 || activeErrorStatus === 403;

  const maxRevenue = Math.max(
    ...dashboard.revenue_series.map((item) => item.revenue),
    1,
  );

  const filteredProducts = useMemo(
    () =>
      products.results.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products.results, search],
  );
  const filteredOrders = useMemo(
    () =>
      orders.results.filter(
        (item) =>
          item.order_number.toLowerCase().includes(search.toLowerCase()) ||
          item.customer_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [orders.results, search],
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
        errors.push(`${file.name}: not an image file`);
        return;
      }

      if (!extension || !ALLOWED_PRODUCT_IMAGE_EXTENSIONS.has(extension)) {
        errors.push(
          `${file.name}: unsupported format (use jpg, jpeg, png, webp, gif, jfif, avif)`,
        );
        return;
      }

      if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
        errors.push(`${file.name}: file is larger than ${MAX_PRODUCT_IMAGE_SIZE_MB}MB`);
        return;
      }

      validFiles.push(file);
    });

    resetProductImageSelection();

    if (!validFiles.length) {
      setMessage({
        type: "error",
        text: errors[0] || "No valid image files selected.",
      });
      return;
    }

    setProductImageFiles(validFiles);
    setProductImagePreviews(validFiles.map((file) => URL.createObjectURL(file)));

    if (errors.length) {
      setMessage({
        type: "error",
        text: `${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ""}`,
      });
    }
  };

  const openCreateProductModal = () => {
    setProductModalMode("create");
    setSelectedProduct(null);
    setProductForm(createEmptyProductForm(defaultCategoryId));
    resetProductImageSelection();
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: AdminProduct) => {
    setProductModalMode("edit");
    setSelectedProduct(product);
    setProductForm(productToForm(product));
    resetProductImageSelection();
    setIsProductModalOpen(true);
  };

  const openDeleteProductModal = (product: AdminProduct) => {
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
    setMessage(null);

    if (!homeTitleForm.made.trim() || !homeTitleForm.title.trim()) {
      setMessage({
        type: "error",
        text: "Fill HomeTitle made and title.",
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
        text: "Select 3 different products for HomeTitle.",
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
        text: "HomeTitle updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(
          error,
          "Failed to update HomeTitle.",
        ),
      });
    }
  };

  const handleProductSave = async () => {
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
    const discountRaw = productForm.discount_price.trim();
    const discountPrice = discountRaw.length ? Number(discountRaw) : null;
    const shouldUpdateVariants =
      productModalMode === "create"
        ? true
        : hasDifferentListValues(sizes, currentSizes) ||
          hasDifferentListValues(colors, currentColors);

    if (!productForm.name.trim() || !productForm.description.trim()) {
      setMessage({ type: "error", text: "Fill product name and description." });
      return;
    }

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setMessage({ type: "error", text: "Base price must be greater than 0." });
      return;
    }

    if (shouldUpdateVariants && (!sizes.length || !colors.length)) {
      setMessage({
        type: "error",
        text: "Add at least one size and one color (CSV).",
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
            ? "Product created successfully."
            : "Product updated successfully.",
      });

      closeProductModal();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(
          error,
          "Failed to save product. Check request data and access.",
        ),
      });
    }
  };

  const handleProductDelete = async () => {
    if (!selectedProduct) {
      return;
    }

    setMessage(null);
    try {
      await deleteAdminProductMutation(selectedProduct.id).unwrap();
      setMessage({
        type: "success",
        text: `Product "${selectedProduct.name}" deleted.`,
      });
      closeProductModal();
    } catch {
      setMessage({
        type: "error",
        text: "Failed to delete product.",
      });
    }
  };

  const handleOrderDelivered = async (id: number) => {
    setMessage(null);
    try {
      await patchAdminOrderStatusMutation({ id, status: "delivered" }).unwrap();
      setMessage({ type: "success", text: `Заказ #${id} обновлен.` });
    } catch {
      setMessage({
        type: "error",
        text: "Не удалось обновить заказ: endpoint подготовлен.",
      });
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
          <h2>Jumana Admin</h2>
          <ul>
            {NAV_ITEMS.map((item) => (
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
              {(activeTab === "products" ||
                activeTab === "orders" ||
                activeTab === "users") && (
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск..."
                />
              )}
              <select value={range} onChange={handleRangeChange}>
                {RANGE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {message && (
            <div
              className={`${scss.message} ${message.type === "success" ? scss.success : scss.error}`}
            >
              {message.text}
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className={scss.dashboard}>
              <div className={scss.kpis}>
                {dashboard.kpis.map((kpi) => (
                  <article key={kpi.id}>
                    <span>{kpi.label}</span>
                    <h3>
                      {kpi.id === "revenue"
                        ? formatMoney(kpi.value)
                        : kpi.value}
                    </h3>
                    <p>
                      {kpi.delta_percent > 0 ? "+" : ""}
                      {kpi.delta_percent}%
                    </p>
                  </article>
                ))}
              </div>

              <div className={scss.gridTwo}>
                <article className={scss.card}>
                  <h3>Доход по дням</h3>
                  <div className={scss.chart}>
                    {dashboard.revenue_series.map((item) => (
                      <div key={item.date} className={scss.barItem}>
                        <div
                          className={scss.bar}
                          style={{
                            height: `${Math.max((item.revenue / maxRevenue) * 100, 8)}%`,
                          }}
                        />
                        <small>{formatDate(item.date).slice(0, 5)}</small>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={scss.card}>
                  <h3>Финансы</h3>
                  <ul>
                    <li>
                      <span>Валовая выручка</span>
                      <strong>
                        {formatMoney(financeSummary.gross_revenue)}
                      </strong>
                    </li>
                    <li>
                      <span>Расходы</span>
                      <strong>
                        {formatMoney(financeSummary.expenses_total)}
                      </strong>
                    </li>
                    <li>
                      <span>Чистая выручка</span>
                      <strong>{formatMoney(financeSummary.net_revenue)}</strong>
                    </li>
                    <li>
                      <span>Прибыль</span>
                      <strong>{formatMoney(financeSummary.profit)}</strong>
                    </li>
                  </ul>
                </article>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className={scss.panel}>
              <div className={scss.panelHead}>
                <h2>Товары</h2>
                <button
                  type="button"
                  onClick={openCreateProductModal}
                >
                  <FiPlus />
                  Добавить
                </button>
              </div>
              <div className={scss.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Sold</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length ? (
                      filteredProducts.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.name}</td>
                          <td>{item.category_name}</td>
                          <td>{item.total_stock}</td>
                          <td>{item.sold_items}</td>
                          <td>{item.active ? "Active" : "Draft"}</td>
                          <td>
                            <div className={scss.rowActions}>
                              <button
                                type="button"
                                className={scss.iconButton}
                                onClick={() => openEditProductModal(item)}
                                aria-label={`Edit ${item.name}`}
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                type="button"
                                className={`${scss.iconButton} ${scss.dangerIcon}`}
                                onClick={() => openDeleteProductModal(item)}
                                aria-label={`Delete ${item.name}`}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className={scss.panel}>
              <h2>Заказы</h2>
              <div className={scss.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Номер</th>
                      <th>Клиент</th>
                      <th>Дата</th>
                      <th>Статус</th>
                      <th>Сумма</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((item) => (
                      <tr key={item.id}>
                        <td>{item.order_number}</td>
                        <td>{item.customer_name}</td>
                        <td>{formatDate(item.created_at)}</td>
                        <td>{STATUS_LABELS[item.status]}</td>
                        <td>{formatMoney(item.total_amount)}</td>
                        <td>
                          {item.status !== "delivered" ? (
                            <button
                              type="button"
                              className={scss.action}
                              onClick={() => void handleOrderDelivered(item.id)}
                            >
                              Доставлен
                            </button>
                          ) : (
                            "Готово"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className={scss.panel}>
              <h2>Контент</h2>
              <div className={scss.cards}>
                <article>
                  <div className={scss.panelHead}>
                    <h3>HomeTitle</h3>
                    <button
                      type="button"
                      onClick={() => void handleHomeTitleSave()}
                      disabled={isSavingHomeTitle}
                    >
                      {isSavingHomeTitle ? "Saving..." : "Save HomeTitle"}
                    </button>
                  </div>
                  <div className={scss.fieldGrid}>
                    <label className={scss.formField}>
                      <span>Made</span>
                      <input
                        value={homeTitleForm.made}
                        onChange={(event) =>
                          handleHomeTitleFieldChange("made", event.target.value)
                        }
                        placeholder="MADE IN KYRGYZSTAN"
                      />
                    </label>
                    <label className={scss.formField}>
                      <span>Title</span>
                      <input
                        value={homeTitleForm.title}
                        onChange={(event) =>
                          handleHomeTitleFieldChange("title", event.target.value)
                        }
                        placeholder="Main banner title"
                      />
                    </label>
                  </div>
                  <div className={scss.fieldGrid}>
                    <label className={scss.formField}>
                      <span>Product 1</span>
                      <select
                        value={homeTitleForm.clothes1_id}
                        onChange={(event) =>
                          handleHomeTitleFieldChange("clothes1_id", event.target.value)
                        }
                      >
                        <option value="">Select product</option>
                        {contentProducts.results.map((product) => (
                          <option key={`home-title-1-${product.id}`} value={String(product.id)}>
                            #{product.id} {product.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={scss.formField}>
                      <span>Product 2</span>
                      <select
                        value={homeTitleForm.clothes2_id}
                        onChange={(event) =>
                          handleHomeTitleFieldChange("clothes2_id", event.target.value)
                        }
                      >
                        <option value="">Select product</option>
                        {contentProducts.results.map((product) => (
                          <option key={`home-title-2-${product.id}`} value={String(product.id)}>
                            #{product.id} {product.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className={scss.formField}>
                    <span>Product 3</span>
                    <select
                      value={homeTitleForm.clothes3_id}
                      onChange={(event) =>
                        handleHomeTitleFieldChange("clothes3_id", event.target.value)
                      }
                    >
                      <option value="">Select product</option>
                      {contentProducts.results.map((product) => (
                        <option key={`home-title-3-${product.id}`} value={String(product.id)}>
                          #{product.id} {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
                {sections.map((item) => (
                  <article key={item.id}>
                    <h3>{item.section_name}</h3>
                    <p>Код: {item.section_code}</p>
                    <p>Блоков: {item.blocks.length}</p>
                    <p>Обновлено: {formatDate(item.updated_at)}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className={scss.panel}>
              <h2>Пользователи</h2>
              <div className={scss.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Orders</th>
                      <th>Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.results.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          {item.first_name} {item.last_name}
                        </td>
                        <td>{item.email}</td>
                        <td>{item.role}</td>
                        <td>{item.total_orders}</td>
                        <td>{formatMoney(item.total_spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className={scss.panel}>
              <h2>События</h2>
              <ul className={scss.activity}>
                {activities.results.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.entity_label}</strong>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <p>{item.message}</p>
                    <small>
                      {item.actor.name} · {item.actor.role}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isProductModalOpen && (
            <div
              className={scss.modalOverlay}
              onClick={(event) => {
                if (event.currentTarget === event.target) {
                  closeProductModal();
                }
              }}
            >
              <div className={scss.modal}>
                <div className={scss.modalHeader}>
                  <h3>
                    {productModalMode === "create"
                      ? "Create Product"
                      : productModalMode === "edit"
                        ? `Edit Product #${selectedProduct?.id ?? ""}`
                        : `Delete Product #${selectedProduct?.id ?? ""}`}
                  </h3>
                  <button
                    type="button"
                    className={scss.closeButton}
                    onClick={closeProductModal}
                    aria-label="Close modal"
                    disabled={isProductMutationLoading}
                  >
                    <FiX />
                  </button>
                </div>

                {productModalMode === "delete" ? (
                  <div className={scss.deleteBox}>
                    <p>
                      Are you sure you want to delete
                      <strong> {selectedProduct?.name}</strong>?
                    </p>
                    <div className={scss.modalActions}>
                      <button
                        type="button"
                        className={scss.secondary}
                        onClick={closeProductModal}
                        disabled={isProductMutationLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={scss.danger}
                        onClick={() => void handleProductDelete()}
                        disabled={isDeletingProduct}
                      >
                        {isDeletingProduct ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={scss.modalBody}>
                      <label className={scss.formField}>
                        <span>Name</span>
                        <input
                          value={productForm.name}
                          onChange={(event) =>
                            handleProductFieldChange("name", event.target.value)
                          }
                          placeholder="Product name"
                        />
                      </label>

                      <label className={scss.formField}>
                        <span>Description</span>
                        <textarea
                          value={productForm.description}
                          onChange={(event) =>
                            handleProductFieldChange("description", event.target.value)
                          }
                          rows={4}
                          placeholder="Short product description"
                        />
                      </label>

                      <div className={scss.fieldGrid}>
                        <label className={scss.formField}>
                          <span>Category</span>
                          <select
                            value={productForm.category_id}
                            onChange={(event) =>
                              handleProductFieldChange("category_id", event.target.value)
                            }
                          >
                            {categories.length ? (
                              categories.map((category) => (
                                <option key={category.id} value={String(category.id)}>
                                  {category.category_name}
                                </option>
                              ))
                            ) : (
                              <option value={String(defaultCategoryId)}>
                                Categories are not loaded
                              </option>
                            )}
                          </select>
                        </label>

                        <label className={scss.formField}>
                          <span>Textile</span>
                          <input
                            value={productForm.textile_name}
                            onChange={(event) =>
                              handleProductFieldChange("textile_name", event.target.value)
                            }
                            placeholder="For example: Tafeta"
                          />
                        </label>
                      </div>

                      <div className={scss.fieldGrid}>
                        <label className={scss.formField}>
                          <span>Base price</span>
                          <input
                            type="number"
                            min={1}
                            value={productForm.base_price}
                            onChange={(event) =>
                              handleProductFieldChange("base_price", event.target.value)
                            }
                          />
                        </label>

                        <label className={scss.formField}>
                          <span>Discount price</span>
                          <input
                            type="number"
                            min={0}
                            value={productForm.discount_price}
                            onChange={(event) =>
                              handleProductFieldChange("discount_price", event.target.value)
                            }
                            placeholder="Optional"
                          />
                        </label>
                      </div>

                      <div className={scss.fieldGrid}>
                        <label className={scss.formField}>
                          <span>Sizes (CSV)</span>
                          <input
                            value={productForm.sizes}
                            onChange={(event) =>
                              handleProductFieldChange("sizes", event.target.value)
                            }
                            placeholder="S, M, L"
                          />
                        </label>

                        <label className={scss.formField}>
                          <span>Colors (CSV)</span>
                          <input
                            value={productForm.colors}
                            onChange={(event) =>
                              handleProductFieldChange("colors", event.target.value)
                            }
                            placeholder="Black, Beige"
                          />
                        </label>
                      </div>

                      <label className={scss.formField}>
                        <span>Promo categories (CSV)</span>
                        <input
                          value={productForm.promo_categories}
                          onChange={(event) =>
                            handleProductFieldChange(
                              "promo_categories",
                              event.target.value,
                            )
                          }
                          placeholder="популярные, тренд"
                        />
                      </label>

                      <div className={scss.uploadBox}>
                        <label className={scss.formField}>
                          <span>Product images</span>
                          <input
                            className={scss.fileInput}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProductImageFilesChange}
                          />
                        </label>
                        <small>
                          Upload files to replace current photos. Up to 10 images, max 7MB each.
                        </small>
                      </div>

                      {productImagePreviews.length > 0 && (
                        <div className={scss.previewGrid}>
                          {productImagePreviews.map((preview, index) => (
                            <div className={scss.previewItem} key={`${preview}-${index}`}>
                              <img src={preview} alt={`preview-${index + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}

                      {productModalMode === "edit" &&
                        productImagePreviews.length === 0 &&
                        (selectedProduct?.images?.length || 0) > 0 && (
                          <div className={scss.previewGrid}>
                            {selectedProduct?.images.map((image) => (
                              <div className={scss.previewItem} key={image.id}>
                                <img
                                  src={resolveImageUrl(image.photo)}
                                  alt={image.color || "product-image"}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                      <label className={scss.inlineCheck}>
                        <input
                          type="checkbox"
                          checked={productForm.active}
                          onChange={(event) =>
                            handleProductFieldChange("active", event.target.checked)
                          }
                        />
                        <span>Publish product</span>
                      </label>
                    </div>

                    <div className={scss.modalActions}>
                      <button
                        type="button"
                        className={scss.secondary}
                        onClick={closeProductModal}
                        disabled={isProductMutationLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleProductSave()}
                        disabled={isSavingProduct}
                      >
                        {isSavingProduct
                          ? "Saving..."
                          : productModalMode === "create"
                            ? "Create"
                            : "Save"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;

