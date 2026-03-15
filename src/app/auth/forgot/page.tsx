import { Suspense } from "react";
import ForgotPage from "../../../appPages/auth/components/pages/ForgotPage";
import AuthDesktopModal from "../../../appPages/auth/components/layout/AuthDesktopModal";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Сброс пароля",
  "Восстановление доступа к аккаунту Jumana.",
  "/auth/forgot",
);

const Page = () => (
  <AuthDesktopModal mode="page">
    <Suspense fallback={null}>
      <ForgotPage />
    </Suspense>
  </AuthDesktopModal>
);

export default Page;
