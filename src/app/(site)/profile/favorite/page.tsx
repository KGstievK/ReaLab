import Favorit from "../../../../appPages/site/components/pages/Favorit";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Избранное",
  "Избранные товары пользователя Jumana.",
  "/profile/favorite",
);

const page = () => {
  return (
    <div>
      <Favorit />
    </div>
  );
};

export default page;
