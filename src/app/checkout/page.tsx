import Checkout from "../../appPages/site/components/pages/Checkout";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "RFQ ReaLab",
  "Запрос коммерческого предложения и консультации в ReaLab.",
  "/checkout",
);

const Page = () => <Checkout />;

export default Page;
