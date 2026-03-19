import AboutReaLabPage from "../../../appPages/site/components/pages/AboutReaLabPage";
import { createPageMetadata } from "@/utils/seo";

export const metadata = createPageMetadata({
  title: "О платформе ReaLab",
  description:
    "История ReaLab, философия платформы, подход к цифровой подаче медтеха и сервисной экосистеме для клиник и лабораторий.",
  path: "/about",
});

const page = () => {
  return (
    <div>
      <AboutReaLabPage />
    </div>
  );
};

export default page;
