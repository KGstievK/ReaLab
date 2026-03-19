import ContactsReaLabPage from "../../../appPages/site/components/pages/ContactsReaLabPage";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "Контакты",
  description:
    "Контакты ReaLab: отдел продаж, procurement-консультация, поставка, внедрение и сервисная поддержка.",
  path: "/contacts",
});

const page = () => {
  return (
    <div>
      <ContactsReaLabPage />
    </div>
  );
};

export default page;
