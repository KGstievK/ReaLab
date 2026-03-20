import CompareReaLabPage from "../../../appPages/site/components/pages/CompareReaLabPage";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Сравнение оборудования ReaLab",
  "Список сравнения оборудования ReaLab для RFQ, согласования и подбора конфигурации.",
  "/compare",
);

const Page = () => <CompareReaLabPage />;

export default Page;
