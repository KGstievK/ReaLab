import { Suspense } from "react";
import SignInPage from "../../../../appPages/auth/components/pages/SignInPage";
import AuthDesktopModal from "../../../../appPages/auth/components/layout/AuthDesktopModal";

const SignInModalPage = () => (
  <AuthDesktopModal>
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  </AuthDesktopModal>
);

export default SignInModalPage;
