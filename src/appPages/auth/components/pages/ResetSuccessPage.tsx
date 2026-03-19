"use client";

import scss from "./ResetSuccessPage.module.scss";
import Image from "next/image";
const logo = "/media/branding/realab-mark.svg";
import backIcon from "@/assets/icons/backIcon.svg";
import { useRouter, useSearchParams } from "next/navigation";

const ResetSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const fromPath = searchParams.get("from");
  const hardMode = searchParams.get("hard") === "1";
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : null;
  const safeFromPath = fromPath && fromPath.startsWith("/") ? fromPath : null;

  const buildAuthPath = (path: string) => {
    const params = new URLSearchParams();

    if (safeNextPath) {
      params.set("next", safeNextPath);
    }

    if (safeFromPath) {
      params.set("from", safeFromPath);
    }

    if (hardMode) {
      params.set("hard", "1");
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(buildAuthPath("/auth/sign-in"));
  };

  return (
    <section className={scss.ResetSuccessPage}>
      <button
        type="button"
        className={scss.backButton}
        onClick={handleBack}
        aria-label="Back"
      >
        <Image src={backIcon} alt="Back" width={24} height={24} />
      </button>
      <Image src={logo} alt="ReaLab logo" className={scss.logo} priority width={136} height={96} />

      <h1>Успех!</h1>

      <div className={scss.iconWrap}>
        <div className={scss.iconCore}>
          <span className={scss.arc} />
          <span className={scss.check} />
          <span className={scss.spark} />
        </div>
      </div>

      <button
        type="button"
        className={scss.submitButton}
        onClick={() => router.push(buildAuthPath("/auth/sign-in"))}
      >
        Войти
      </button>
    </section>
  );
};

export default ResetSuccessPage;
