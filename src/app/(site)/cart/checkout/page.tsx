import Checkout from "../../../../appPages/site/components/pages/Checkout";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Checkout ReaLab",
  "Оформление поставки и оплаты оборудования ReaLab.",
  "/cart/checkout",
);

const page = () => <Checkout />;

export default page;
