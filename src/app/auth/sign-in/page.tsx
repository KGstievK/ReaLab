import { Suspense } from "react";
import SignInPage from "../../../appPages/auth/components/pages/SignInPage";
import AuthDesktopModal from "../../../appPages/auth/components/layout/AuthDesktopModal";

const Page = () => (
  <AuthDesktopModal mode="page">
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  </AuthDesktopModal>
);

export default Page;
