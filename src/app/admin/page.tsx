import AdminPanel from "../../appPages/admin/components/pages/AdminPanel/AdminPanel";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Админ-панель",
  "Служебная админ-панель ReaLab.",
  "/admin",
);

const AdminPage = () => {
  return <AdminPanel />;
};

export default AdminPage;

