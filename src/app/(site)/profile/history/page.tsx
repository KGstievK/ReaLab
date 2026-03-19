import History from "../../../../appPages/site/components/pages/user/components/pages/History/History";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "История заказов ReaLab",
  "История заказов и поставок пользователя ReaLab.",
  "/profile/history",
);

const page = () => {
  return (
    <div>
      <History />
    </div>
  );
};

export default page;
