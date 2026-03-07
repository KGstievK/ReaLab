import { Suspense } from "react";
import NewPasswordPage from "../../../../appPages/auth/components/pages/NewPasswordPage";
import AuthDesktopModal from "../../../../appPages/auth/components/layout/AuthDesktopModal";

const NewPasswordModalPage = () => (
  <AuthDesktopModal>
    <Suspense fallback={null}>
      <NewPasswordPage />
    </Suspense>
  </AuthDesktopModal>
);

export default NewPasswordModalPage;
