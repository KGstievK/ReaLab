import Checkout from "../../appPages/site/components/pages/Checkout";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Оформление заказа",
  "Оформление заказа в ReaLab.",
  "/checkout",
);

const Page = () => <Checkout />;

export default Page;
