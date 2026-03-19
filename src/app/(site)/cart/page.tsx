import Cart from "../../../appPages/site/components/pages/Cart";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Корзина ReaLab",
  "Корзина ReaLab для оформления поставки медицинского оборудования.",
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
