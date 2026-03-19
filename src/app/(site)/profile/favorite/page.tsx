import Favorit from "../../../../appPages/site/components/pages/Favorit";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Избранное ReaLab",
  "Избранные позиции и сохраненные решения пользователя ReaLab.",
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
