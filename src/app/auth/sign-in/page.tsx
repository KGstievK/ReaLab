import { Suspense } from "react";
import SignInPage from "../../../appPages/auth/components/pages/SignInPage";
import AuthDesktopModal from "../../../appPages/auth/components/layout/AuthDesktopModal";
import { createNoIndexMetadata } from "@/utils/seo";

export const metadata = createNoIndexMetadata(
  "Вход в ReaLab",
  "Вход в аккаунт ReaLab.",
  "/auth/sign-in",
);

const Page = () => (
  <AuthDesktopModal mode="page">
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  </AuthDesktopModal>
);

export default Page;
