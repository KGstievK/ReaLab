import { Suspense } from "react";
import SignUpPage from "../../../appPages/auth/components/pages/SignUpPage";
import AuthDesktopModal from "../../../appPages/auth/components/layout/AuthDesktopModal";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Регистрация в ReaLab",
  "Регистрация аккаунта ReaLab.",
  "/auth/sign-up",
);

const Page = () => (
  <AuthDesktopModal mode="page">
    <Suspense fallback={null}>
      <SignUpPage />
    </Suspense>
  </AuthDesktopModal>
);

export default Page;
