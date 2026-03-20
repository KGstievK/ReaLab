import Favorit from "../../../../appPages/site/components/pages/Favorit";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Сохраненные позиции ReaLab",
  "Shortlist и сохраненные позиции пользователя ReaLab для RFQ и консультаций.",
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
