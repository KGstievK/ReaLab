import { Suspense } from "react";
import ResetSuccessPage from "../../../appPages/auth/components/pages/ResetSuccessPage";
import AuthDesktopModal from "../../../appPages/auth/components/layout/AuthDesktopModal";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Пароль изменён",
  "Подтверждение успешной смены пароля в Jumana.",
  "/auth/reset_success",
);

const Page = () => {
  return (
    <AuthDesktopModal mode="page">
      <Suspense fallback={null}>
        <ResetSuccessPage />
      </Suspense>
    </AuthDesktopModal>
  );
};

export default Page;
