import PopularClothes from "../../../appPages/site/components/pages/ProductList/popularClothes/PopularClothes";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Популярное",
  description:
    "Популярные модели Jumana: востребованные платья, туники и комплекты в эстетике premium modest fashion.",
  path: "/popular",
});

const page = () => <PopularClothes />;

export default page;
