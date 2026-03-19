import { Suspense } from "react";
import ResetPasswordPage from "../../../appPages/auth/components/pages/ResetPasswordPage";
import AuthDesktopModal from "../../../appPages/auth/components/layout/AuthDesktopModal";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Подтверждение кода ReaLab",
  "Подтверждение кода для восстановления доступа к аккаунту ReaLab.",
  "/auth/reset_password",
);

const Page = () => {
  return (
    <AuthDesktopModal mode="page">
      <Suspense fallback={null}>
        <ResetPasswordPage />
      </Suspense>
    </AuthDesktopModal>
  );
};

export default Page;
