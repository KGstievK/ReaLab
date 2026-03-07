import { Suspense } from "react";
import SignUpPage from "../../../appPages/auth/components/pages/SignUpPage";
import AuthDesktopModal from "../../../appPages/auth/components/layout/AuthDesktopModal";

const Page = () => (
  <AuthDesktopModal mode="page">
    <Suspense fallback={null}>
      <SignUpPage />
    </Suspense>
  </AuthDesktopModal>
);

export default Page;
