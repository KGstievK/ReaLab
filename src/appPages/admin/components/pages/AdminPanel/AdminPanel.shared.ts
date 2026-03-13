export const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  placed: "Заказ размещен",
  processing: "Собирается",
  packaging: "Собирается",
  shipping: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
  returned: "Возврат",
};

export const ADMIN_PERMISSIONS = {
  ADMIN_ACCESS: "admin.access",
  DASHBOARD_VIEW: "dashboard.view",
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_MANAGE: "products.manage",
  PRODUCTS_DELETE: "products.delete",
  DISCOUNTS_VIEW: "discounts.view",
  DISCOUNTS_MANAGE: "discounts.manage",
  ORDERS_VIEW: "orders.view",
  ORDERS_MANAGE: "orders.manage",
  CONTENT_VIEW: "content.view",
  CONTENT_MANAGE: "content.manage",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  ACTIVITY_VIEW: "activity.view",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const hasPermission = (
  permissions: string[] | undefined,
  permission: AdminPermission,
): boolean => Boolean(permissions?.includes(permission));

export const ORDER_WORKFLOW: AdminOrderStatus[] = [
  "placed",
  "processing",
  "shipping",
  "delivered",
];

export const normalizeWorkflowStatus = (status: AdminOrderStatus): AdminOrderStatus =>
  status === "packaging" ? "processing" : status;

export const getNextOrderStatus = (status: AdminOrderStatus): AdminOrderStatus | null => {
  const normalized = normalizeWorkflowStatus(status);
  const currentIndex = ORDER_WORKFLOW.indexOf(normalized);
  if (currentIndex < 0 || currentIndex >= ORDER_WORKFLOW.length - 1) {
    return null;
  }

  return ORDER_WORKFLOW[currentIndex + 1];
};

export const PAYMENT_STATUS_LABELS: Record<AdminPaymentStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Ошибка оплаты",
  refunded: "Возврат",
};

export const DELIVERY_METHOD_LABELS: Record<AdminDeliveryMethod, string> = {
  courier: "Курьер",
  pickup: "Самовывоз",
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  placed: "Создан",
  processing: "Собирается",
  shipping: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
  returned: "Возврат",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  OWNER: "Владелец",
  CUSTOMER: "Покупатель",
  USER: "Пользователь",
  admin: "Администратор",
  manager: "Менеджер",
  owner: "Владелец",
  customer: "Покупатель",
  user: "Пользователь",
};

export const formatRoleLabel = (role: string): string => ROLE_LABELS[role] || role;

export const RANGE_LABELS: Record<AdminDateRange, string> = {
  today: "Сегодня",
  week: "Неделя",
  month: "Месяц",
  quarter: "Квартал",
  year: "Год",
  custom: "Произвольный период",
};

export const RANGE_OPTIONS: AdminDateRange[] = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
];

export const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(value)} с`;

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const getEffectiveProductPrice = (product: AdminProduct): number =>
  product.discount_price !== null && product.discount_price < product.base_price
    ? product.discount_price
    : product.base_price;

export const getDiscountPercent = (product: AdminProduct): number => {
  if (!product.discount_price || product.discount_price >= product.base_price || product.base_price <= 0) {
    return 0;
  }

  return Number(
    (((product.base_price - product.discount_price) / product.base_price) * 100).toFixed(1),
  );
};
