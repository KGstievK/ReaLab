import Profile from "../../../../appPages/site/components/pages/user/components/pages/Profile";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Мой кабинет",
  "Настройки и данные профиля пользователя Jumana.",
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
