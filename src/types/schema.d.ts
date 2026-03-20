// interface User {
//   _id?: number;
//   username: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   address: string;
//   index_pochta: string;
//   number: string;
// }

interface GetContactInfo {
  messenger: string;
  email: string;
  address: string;
}

interface SaleContent {
  img: string;
  title: string;
  text: string;
}

interface AllClothes {
  id: number;
  category_name: string;
  promo_category: Array<{
    promo_category: string;
  }>;
  clothes_name: string;
  price: number;
  discount_price: number;
  size: Array<string>;
  average_rating: number;
  created_date: string;
  clothes_img: Array<{
    id: number;
    photo: string;
    color: string;
  }>;
}



interface AllCart {
  id: number;
  user: number;
  total_price: string;
  cart_items: Array<{
    id: number;
    clothes: {
      clothes_name: string;
      clothes_img: Array<{
        id: number;
        photo: string;
        color: string;
      }>;
    };
    size: string;
    color: number;
    quantity: number;
    price_clothes: string;
    total_price: string;
    color_id: number;
    clothes_id: number;
    just_price: string;
  }>;
}
interface cart {
  id: number;
  clothes: {
    clothes_name: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  size: string;
  color: number;
  quantity: number;
  price_clothes: string;
  total_price: string;
  color_id: number;
  clothes_id: number;
  just_price: string;
}
interface get_cart_item {
  id: number;
  clothes: {
    clothes_name: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  clothes_id: number;
  quantity: number;
  size: string;
  color: {
    id: number;
    photo: string;
    color: string;
  };
  color_id: number;
  just_price: string;
}

interface post_cart_item {
  clothes: {
    clothes_name: string;
  };
  clothes_id: number;
  quantity: number;
  size: string;
  color: {
    color: string;
  };
  color_id: number;
}
interface patch_cart_item {
  quantity: number;
}

interface AboutUs {
  title: string;
  made: string;
  logo: string;
  about_me: Array<{
    title: string;
    text: string;
    img: string;
  }>;
}

interface category {
  category_name: string;
  count?: number;
  clothes_category: Array<{
    id: number;
    promo_category: Array<{
      promo_category: string;
    }>;
    clothes_name: string;
    price: number;
    discount_price: number;
    size: Array<string>;
    average_rating: number;
    created_date: string;
    clothes_img: Array<{
      photo: string;
      color: string;
    }>;
  }>;
}
//! data type

interface Review {
  author: {
    name: string;
    avatar: string; // При необходимости можно добавить фото автора
  };
  text: string;
  stars: number;
  review_photo: string | null;
  created_date: string;
}

interface Color {
  id: number;
  color: string;
  color_photo: string[];
}

interface PromoCategory {
  promo_category: string;
  time: string | null;
}

interface Textile {
  textile_name: string;
}

interface IOrderPost {
  order_user: number;
  cart_id: number;
  delivery: "курьер" | "самовывоз";
  first_name: string;
  phone_number: string;
  city: string;
  address: string;
  country?: string;
  payment_method?: "mbank_redirect" | "finca_qr" | "manual";
  save_address?: boolean;
}

type OrderStatus =
  | "Заказ размещен"
  | "Собирается"
  | "В пути"
  | "Доставлен"
  | "Отменен";

type LeadRequestKind = "rfq" | "consultation" | "demo" | "service" | "partner";
type LeadRequestStatus =
  | "new"
  | "qualified"
  | "quoted"
  | "in_progress"
  | "won"
  | "lost"
  | "closed";

interface LeadRequestItem {
  id: number;
  product_id: number | null;
  quantity: number;
  configuration_label: string;
  color_label: string;
  product_name: string;
  image_url: string;
}

interface LeadRequestCreatePayload {
  kind?: LeadRequestKind;
  name: string;
  company?: string;
  role_title?: string;
  phone: string;
  email: string;
  city?: string;
  country?: string;
  organization_type?: string;
  request_purpose?: string;
  comment?: string;
  source_path?: string;
  items?: Array<{
    product_id?: number;
    quantity?: number;
    configuration_label?: string;
    color_label?: string;
    product_name?: string;
    image_url?: string;
  }>;
}

interface LeadRequest {
  id: number;
  request_number: string;
  kind: LeadRequestKind;
  status: LeadRequestStatus;
  name: string;
  company: string;
  role_title: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  organization_type: string;
  request_purpose: string;
  comment: string;
  source_path: string;
  manager_note: string;
  created_at: string;
  updated_at: string;
  submitted_by_user: {
    id: number;
    name: string;
    email: string;
  } | null;
  items: LeadRequestItem[];
  items_count: number;
  total_units: number;
}

interface IOrder {
  id: number;
  order_number?: string;
  cart: {
    id: number;
    user: number;
    total_price: string;
    cart_items: Array<{
      order_status: string;
      id: number;
      clothes: {
        clothes_name: string;
        clothes_img: Array<{
          id: number;
          photo: string;
          color: string;
        }>;
      };
      size: string;
      color: number | string;
      quantity: number;
      price_clothes: string;
      total_price: string;
      color_id: number;
      clothes_id: number;
      variant_id?: number | null;
      sku?: string | null;
      just_price: string;
    }>;
  };
  date: string;
  order_status: string;
  delivery: string;
  first_name: string;
  phone_number: string;
  city: string;
  address: string;
  payment?: {
    id: number;
    status: string;
    method: string;
    provider: string;
    amount: string;
    currency: string;
    external_ref: string | null;
  } | null;
  payment_session?: PaymentSessionContract | null;
  shipment?: {
    status: string;
    delivery_method: string;
    price: string;
    currency: string;
    carrier: string | null;
    service_name: string | null;
    tracking_number: string | null;
    city: string;
    address: string;
  } | null;
  shipping_address?: {
    id: number;
    recipient_name: string;
    phone_number: string;
    city: string;
    address: string;
  } | null;
}
interface Pay {
  whatsapp: string;
  pay_title: Array<{
    pay_img: string;
    number: string;
    info: string;
  }>;
}

interface PaymentMethodOption {
  id: "mbank_redirect" | "finca_qr" | "manual";
  provider: string;
  label: string;
  description: string;
  kind: "redirect" | "qr" | "manual";
  currency: "KGS";
  is_enabled: boolean;
  sort_order: number;
}

interface PaymentSessionContract {
  payment_id: number;
  provider: string;
  method: "mbank_redirect" | "finca_qr" | "manual";
  kind: "redirect" | "qr" | "manual";
  session_id: string;
  reference: string;
  order_number: string;
  amount: string;
  currency: "KGS";
  status: string;
  expires_at: string | null;
  instructions: string[];
  redirect_url: string | null;
  redirect_payload: Record<string, string | null> | null;
  qr_payload: string | null;
  qr_reference: string | null;
}

interface SingleProductData {
  id: number;
  clothes_name: string;
  category: Array<{
    category_name: string;
  }>;
  promo_category: Array<{
    promo_category: string;
    time: string;
  }>;
  quantities: number;
  active: boolean;
  price: number;
  discount_price: string;
  size: string;
  average_rating: string;
  made_in: string;
  textile_clothes: Array<{
    textile_name: string;
  }>;
  clothes_img: Array<{
    id: number;
    photo: string;
    color: string;
  }>;
  clothes_review: Array<{
    author: {
      first_name: string;
      last_name: string;
    };
    text: string;
    stars: number;
    review_photo: string;
    created_date: string;
  }>;
  clothes_description: string;
}

interface getOrderitem {
  id: number;
  order_number?: string;
  cart: {
    id: number;
    user: number;
    total_price: string;
    cart_items: Array<{
      id: number;
      clothes: {
        clothes_name: string;
        clothes_img: Array<{
          id: number;
          photo: string;
          color: string;
        }>;
      };
      size: string;
      color: number | string;
      quantity: number;
      price_clothes: string;
      total_price: string;
      color_id: number;
      clothes_id: number;
      variant_id?: number | null;
      sku?: string | null;
      just_price: string;
    }>;
  };
  date: string;
  order_status: string;
  delivery: string;
  order_info: {
    first_name: string;
    phone_number: string;
    city: string;
    address: string;
  };
}

//! data type

interface PostToFavoriteRes {
  id: number;
  clothes: {
    id: number;
    promo_category: Array<{
      promo_category: string;
    }>;
    clothes_name: string;
    price: number;
    discount_price: string;
    size: string;
    average_rating: string;
    created_date: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  clothes_id: number;
  favorite_user: number;
}

interface PostToFavoriteReq {
  clothes: {
    promo_category: Array<{
      promo_category: string;
    }>;
    clothes_name: string;
    price: number;
    size: string;
  };
  clothes_id: number;
  favorite_user: number;
}

interface GetFavorites {
  id: number;
  clothes: {
    id: number;
    promo_category: Array<{
      promo_category: string;
    }>;
    clothes_name: string;
    price: number;
    discount_price: string;
    size: string;
    average_rating: string;
    created_date: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  time: string;
}

interface firstSection {
  made: string;
  title: string;
  clothes1: {
    id: number;
    promo_category: Array<{
      promo_category: string;
    }>;
    clothes_name: string;
    price: number;
    discount_price: number;
    size: Array<string>;
    average_rating: number;
    created_date: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  clothes2: {
    id: number;
    promo_category: Array<{
      promo_category: string;
    }>;
    clothes_name: string;
    price: number;
    discount_price: number;
    size: Array<string>;
    average_rating: number;
    created_date: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  clothes3: {
    id: number;
    promo_category: Array<{
      promo_category: string;
    }>;
    clothes_name: string;
    price: number;
    discount_price: number;
    size: Array<string>;
    average_rating: number;
    created_date: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
}

type AdminDateRange = "today" | "week" | "month" | "quarter" | "year" | "custom";
type AdminTrend = "up" | "down" | "flat";
type AdminOrderStatus =
  | "placed"
  | "processing"
  | "packaging"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "returned";
type AdminPaymentStatus = "pending" | "paid" | "failed" | "refunded";
type AdminDeliveryMethod = "courier" | "pickup";
type AdminRole = "customer" | "manager" | "admin" | "owner";
type AdminActivityType =
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "order_created"
  | "order_status_changed"
  | "lead_created"
  | "lead_status_changed"
  | "content_updated"
  | "category_updated"
  | "price_changed"
  | "stock_changed";

interface AdminKpiMetric {
  id: string;
  label: string;
  value: number;
  trend: AdminTrend;
  delta_percent: number;
  help_text?: string;
}

interface AdminRevenuePoint {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  orders: number;
  sold_items: number;
  added_products: number;
}

interface AdminTopProduct {
  product_id: number;
  product_name: string;
  sold_items: number;
  orders_count: number;
  revenue: number;
  current_stock: number;
}

interface AdminInventoryItem {
  product_id: number;
  product_name: string;
  sku: string;
  stock: number;
  min_stock: number;
  updated_at: string;
  is_low_stock: boolean;
}

interface AdminInventoryRecord {
  id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  category_name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  min_stock: number;
  is_low_stock: boolean;
  is_active: boolean;
  updated_at: string;
}

interface AdminInventoryMovement {
  id: number;
  inventory_id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  type: "initial" | "manual_adjustment" | "order_reserved" | "order_released";
  quantity_delta: number;
  balance_after: number;
  note: string;
  order_id: number | null;
  order_number: string | null;
  created_at: string;
}

interface AdminOrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string;
  color: string;
  image_url: string;
}

interface AdminOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  city: string;
  address: string;
  created_at: string;
  updated_at: string;
  status: AdminOrderStatus;
  payment_status: AdminPaymentStatus;
  delivery_method: AdminDeliveryMethod;
  shipping_address?: {
    id: number;
    recipient_name: string;
    phone_number: string;
    city: string;
    address: string;
    country: string;
    postal_code: string;
  } | null;
  payment?: {
    status: AdminPaymentStatus;
    method: string;
    provider: string;
    amount: number;
    currency: string;
    external_ref: string | null;
    paid_at: string | null;
  } | null;
  shipment?: {
    status: string;
    delivery_method: AdminDeliveryMethod;
    price: number;
    currency: string;
    carrier: string | null;
    service_name: string | null;
    tracking_number: string | null;
    city: string;
    address: string;
    recipient_name: string;
    phone_number: string;
  } | null;
  subtotal: number;
  delivery_price: number;
  discount_amount: number;
  total_amount: number;
  items: AdminOrderItem[];
}

interface AdminDashboardOverview {
  generated_at: string;
  range: AdminDateRange;
  currency: "KGS";
  kpis: AdminKpiMetric[];
  revenue_series: AdminRevenuePoint[];
  top_products: AdminTopProduct[];
  low_stock: AdminInventoryItem[];
  recent_orders: AdminOrder[];
}

interface AdminProductImage {
  id: number;
  photo: string;
  color: string;
  is_primary: boolean;
}

interface AdminProductVariant {
  id: number;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  discount_price: number | null;
  cost_price: number;
  active: boolean;
}

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  category_id: number;
  category_name: string;
  textile_name: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  average_rating: number;
  sold_items: number;
  total_stock: number;
  base_price: number;
  discount_price: number | null;
  cost_price: number;
  promo_categories: string[];
  images: AdminProductImage[];
  variants: AdminProductVariant[];
}

interface AdminProductPayload {
  name: string;
  description: string;
  category_id: number;
  textile_name: string;
  active: boolean;
  base_price: number;
  cost_price: number;
  discount_price: number | null;
  sizes: string[];
  colors: string[];
  promo_categories?: string[];
}

interface AdminCategory {
  id: number;
  category_name: string;
  slug: string;
  clothes_count: number;
  created_at: string;
  updated_at: string;
}

interface AdminCategoryPayload {
  category_name: string;
  slug?: string;
}

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  legacy_role: AdminRole;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  assigned_roles: AdminAssignedRole[];
  permissions: string[];
}

interface AdminPermissionItem {
  id: number;
  key: string;
  name: string;
  description: string;
}

interface AdminAssignedRole {
  id: number;
  key: string;
  name: string;
  is_system: boolean;
}

interface AdminRbacRole {
  id: number;
  key: string;
  name: string;
  description: string;
  is_system: boolean;
  user_count: number;
  permissions: AdminPermissionItem[];
}

interface AdminUserRoleAssignmentResult {
  user_id: number;
  username: string;
  assigned_roles: AdminAssignedRole[];
  permissions: string[];
}

interface AdminCmsBlock {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
  sort_order: number;
  active: boolean;
}

interface AdminCmsSection {
  id: number;
  section_code: string;
  section_name: string;
  updated_at: string;
  blocks: AdminCmsBlock[];
}

interface AdminCmsSectionPayload {
  section_name?: string;
  blocks?: Array<{
    id?: number;
    key: string;
    title: string;
    subtitle: string;
    image: string;
    cta_text: string;
    cta_link: string;
    sort_order: number;
    active: boolean;
  }>;
}

interface AdminHomeTitle {
  id: number | null;
  made: string;
  title: string;
  clothes_ids: number[];
  updated_at: string | null;
}

interface AdminHomeTitlePayload {
  made?: string;
  title?: string;
  clothes_ids?: number[];
}

interface AdminFinanceSummary {
  period_start: string;
  period_end: string;
  currency: "KGS";
  product_revenue: number;
  gross_revenue: number;
  net_revenue: number;
  discount_total: number;
  delivery_income: number;
  refund_total: number;
  expenses_total: number;
  cost_of_goods_sold: number;
  profit: number;
  average_order_value: number;
  paid_orders: number;
  failed_orders: number;
}

interface AdminActivityActor {
  id: number;
  name: string;
  role: AdminRole;
}

interface AdminActivityEvent {
  id: number;
  type: AdminActivityType;
  entity: "product" | "order" | "lead_request" | "category" | "content" | "user";
  entity_id: number;
  entity_label: string;
  message: string;
  created_at: string;
  actor: AdminActivityActor;
  metadata: Record<string, string | number | boolean | null>;
}

interface AdminAuditLog {
  id: number;
  entity: "product" | "order" | "lead_request" | "category" | "content" | "user";
  entity_id: number;
  entity_label: string;
  action: string;
  message: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  trace_id: string | null;
  created_at: string;
  actor: AdminActivityActor | null;
}

interface AdminPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type AdminLeadRequest = LeadRequest;


