import Checkout from "../../../../appPages/site/components/pages/Checkout";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Оформление заказа",
  "Оформление заказа в интернет-магазине Jumana.",
  "/cart/checkout",
);

const page = () => <Checkout />;

export default page;
