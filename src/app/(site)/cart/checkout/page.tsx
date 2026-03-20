import Checkout from "../../../../appPages/site/components/pages/Checkout";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "RFQ ReaLab",
  "Запрос коммерческого предложения и консультации по оборудованию ReaLab.",
  "/cart/checkout",
);

const page = () => <Checkout />;

export default page;
