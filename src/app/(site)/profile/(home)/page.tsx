import Profile from "../../../../appPages/site/components/pages/user/components/pages/Profile";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Профиль ReaLab",
  "Личный кабинет пользователя ReaLab.",
  "/profile",
);

const page = () => {
  return (
    <div>
      <Profile />
    </div>
  );
};

export default page;
