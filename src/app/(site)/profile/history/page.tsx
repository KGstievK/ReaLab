import History from "../../../../appPages/site/components/pages/user/components/pages/History/History";
import { createNoIndexMetadata } from "@/utils/seo";
import RequestHistory from "../../../../appPages/site/components/pages/user/components/pages/History/RequestHistory";

export const metadata = createNoIndexMetadata(
  "История заявок ReaLab",
  "История RFQ, консультаций и сервисных обращений пользователя ReaLab.",
  "/profile/history",
);

const page = () => {
  return (
    <div>
      <RequestHistory />
    </div>
  );
};

export default page;
