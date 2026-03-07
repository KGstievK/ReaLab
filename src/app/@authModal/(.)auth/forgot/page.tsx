import { Suspense } from "react";
import ForgotPage from "../../../../appPages/auth/components/pages/ForgotPage";
import AuthDesktopModal from "../../../../appPages/auth/components/layout/AuthDesktopModal";

const ForgotModalPage = () => (
  <AuthDesktopModal>
    <Suspense fallback={null}>
      <ForgotPage />
    </Suspense>
  </AuthDesktopModal>
);

export default ForgotModalPage;
