import NewClothes from "../../../appPages/site/components/pages/NewClothes";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Новинки",
  description:
    "Новые поступления Jumana: скромная женская одежда, свежие коллекции и актуальные модели modest fashion.",
  path: "/new",
});

const page = () => <NewClothes />;

export default page;
