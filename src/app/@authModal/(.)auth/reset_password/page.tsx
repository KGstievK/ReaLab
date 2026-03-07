import { Suspense } from "react";
import ResetPasswordPage from "../../../../appPages/auth/components/pages/ResetPasswordPage";
import AuthDesktopModal from "../../../../appPages/auth/components/layout/AuthDesktopModal";

const ResetPasswordModalPage = () => (
  <AuthDesktopModal>
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  </AuthDesktopModal>
);

export default ResetPasswordModalPage;
