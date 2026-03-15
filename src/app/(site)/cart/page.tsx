import Cart from "../../../appPages/site/components/pages/Cart";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Корзина",
  "Корзина интернет-магазина Jumana.",
  "/cart",
);

const page = () => {
  return (
    <div>
      <Cart />
    </div>
  );
};

export default page;
