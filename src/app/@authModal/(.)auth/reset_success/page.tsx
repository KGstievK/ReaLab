import { Suspense } from "react";
import ResetSuccessPage from "../../../../appPages/auth/components/pages/ResetSuccessPage";
import AuthDesktopModal from "../../../../appPages/auth/components/layout/AuthDesktopModal";

const ResetSuccessModalPage = () => (
  <AuthDesktopModal>
    <Suspense fallback={null}>
      <ResetSuccessPage />
    </Suspense>
  </AuthDesktopModal>
);

export default ResetSuccessModalPage;
