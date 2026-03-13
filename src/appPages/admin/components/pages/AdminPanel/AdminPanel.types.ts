export type AdminTab =
  | "dashboard"
  | "products"
  | "discounts"
  | "orders"
  | "content"
  | "users"
  | "activity";

export type ProductModalMode = "create" | "edit" | "delete";

export type ProductFormState = {
  name: string;
  description: string;
  category_id: string;
  textile_name: string;
  active: boolean;
  base_price: string;
  cost_price: string;
  discount_price: string;
  sizes: string;
  colors: string;
  promo_categories: string;
};

export type HomeTitleFormState = {
  made: string;
  title: string;
  clothes1_id: string;
  clothes2_id: string;
  clothes3_id: string;
};

export type AboutBlockFormState = {
  title: string;
  text: string;
  img: string;
  sort_order: string;
};

export type AboutPageFormState = {
  title: string;
  made: string;
  logo: string;
  blocks: AboutBlockFormState[];
};
