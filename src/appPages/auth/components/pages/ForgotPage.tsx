"use client";

import Image from "next/image";
import scss from "./ForgotPage.module.scss";
import { SubmitHandler, useForm } from "react-hook-form";
import logo from "@/assets/icons/logo.svg";
import backIcon from "@/assets/icons/backIcon.svg";
import { usePostForgotPasswordMutation } from "../../../../redux/api/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type ForgotFormValues = {
  email: string;
};

const ForgotPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>();
  const [postForgotPassword, { isLoading }] = usePostForgotPasswordMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nextPath = searchParams.get("next");
  const fromPath = searchParams.get("from");
  const hardMode = searchParams.get("hard") === "1";
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : null;
  const safeFromPath = fromPath && fromPath.startsWith("/") ? fromPath : null;

  const buildAuthPath = (path: string, extra?: Record<string, string>) => {
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

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        params.set(key, value);
      });
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

  const goToVerify = (contact: string) => {
    router.push(buildAuthPath("/auth/reset_password", { contact }));
  };

  const onSubmit: SubmitHandler<ForgotFormValues> = async (data) => {
    const contact = data.email.trim();
    if (!contact) return;

    setSubmitError(null);

    if (!process.env.NEXT_PUBLIC_API_URL) {
      goToVerify(contact);
      return;
    }

    try {
      await postForgotPassword({ email: contact }).unwrap();
      goToVerify(contact);
    } catch (error: any) {
      const errorMessage =
        error?.data?.data?.email?.[0] ||
        error?.data?.message ||
        error?.error ||
        null;

      if (errorMessage) {
        setSubmitError(String(errorMessage));
        return;
      }

      // Allow continuing in local mode when backend is unavailable.
      goToVerify(contact);
    }
  };

  return (
    <section className={scss.ForgotPage}>
      <button
        type="button"
        className={scss.backButton}
        onClick={handleBack}
        aria-label="Back"
      >
        <Image src={backIcon} alt="Back" width={24} height={24} />
      </button>
      <Image src={logo} alt="Jumana logo" className={scss.logo} priority />
      <h1>Забыли пароль?</h1>
      <p>Введите свой номер телефона, чтобы сбросить пароль</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          {...register("email", { required: true })}
          placeholder="Номер телефона"
          autoComplete="tel"
        />
        {errors.email && <span>Введите номер телефона</span>}
        {submitError && <span>{submitError}</span>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Отправка..." : "Продолжить"}
        </button>
      </form>
    </section>
  );
};

export default ForgotPage;
