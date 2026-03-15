import SalePage from "../../../appPages/site/components/pages/ProductList/sale/Sale";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Sale",
  description:
    "Скидки и специальные предложения Jumana на скромную женскую одежду, платья, комплекты и аксессуары.",
  path: "/sale",
});

const page = () => <SalePage />;
export default page;
