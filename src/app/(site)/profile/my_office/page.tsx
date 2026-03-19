import Profile from "../../../../appPages/site/components/pages/user/components/pages/Profile";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Мой кабинет ReaLab",
  "Настройки профиля и адресов пользователя ReaLab.",
  "/profile/my_office",
);

const page = () => {
  return (
    <div>
      <Profile />
    </div>
  );
};

export default page;
