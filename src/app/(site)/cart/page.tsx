import Cart from "../../../appPages/site/components/pages/Cart";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Список запроса ReaLab",
  "Request basket ReaLab для RFQ, консультации и подготовки коммерческого предложения.",
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
