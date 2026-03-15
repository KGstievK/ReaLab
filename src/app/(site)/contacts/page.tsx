import Contacts from "../../../appPages/site/components/pages/Contacts";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Контакты",
  description:
    "Контакты Jumana: способы связи, консультация по заказу, доставка, оплата и помощь покупателям.",
  path: "/contacts",
});

const page = () => {
  return (
    <div>
      <Contacts />
    </div>
  );
};

export default page;
