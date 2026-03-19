"use client";

import scss from "./NewPasswordPage.module.scss";
import Image from "next/image";
const logo = "/media/branding/realab-mark.svg";
import backIcon from "@/assets/icons/backIcon.svg";
import { HiOutlineLockClosed } from "react-icons/hi";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  usePostForgotPasswordMutation,
  usePostResetPasswordMutation,
} from "../../../../redux/api/auth";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";

type NewPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

const NewPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [postResetPassword, { isLoading }] = usePostResetPasswordMutation();
  const [postForgotPassword, { isLoading: isResendLoading }] =
    usePostForgotPasswordMutation();

  const contact = (searchParams.get("contact") || "").trim();
  const code = (searchParams.get("code") || "").trim();
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

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<NewPasswordFormValues>();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!contact || !code) {
      router.replace(buildAuthPath("/auth/forgot"));
    }
  }, [code, contact, router, safeFromPath, safeNextPath]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    if (contact) {
      router.push(buildAuthPath("/auth/reset_password", { contact }));
      return;
    }

    router.push(buildAuthPath("/auth/forgot"));
  };

  const onSubmit: SubmitHandler<NewPasswordFormValues> = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "validate",
        message: "Пароли не совпадают",
      });
      return;
    }

    clearErrors("confirmPassword");
    setSubmitError(null);

    if (!process.env.NEXT_PUBLIC_API_URL) {
      router.push(buildAuthPath("/auth/reset_success"));
      return;
    }

    try {
      await postResetPassword({
        email: contact,
        reset_code: code,
        new_password: data.newPassword,
      }).unwrap();

      router.push(buildAuthPath("/auth/reset_success"));
    } catch (error: any) {
      const apiError = extractApiErrorInfo(error, "Не удалось изменить пароль");
      setSubmitError(
        getRateLimitAwareMessage(
          apiError,
          "Слишком много попыток смены пароля. Попробуйте позже.",
        ),
      );
    }
  };

  const handleResend = async () => {
    if (!contact) return;

    setResendError(null);

    if (!process.env.NEXT_PUBLIC_API_URL) {
      return;
    }

    try {
      await postForgotPassword({ email: contact }).unwrap();
    } catch (error: any) {
      const apiError = extractApiErrorInfo(error, "Не удалось отправить код повторно");
      setResendError(
        getRateLimitAwareMessage(
          apiError,
          "Слишком много запросов на повторную отправку кода. Попробуйте позже.",
        ),
      );
    }
  };

  return (
    <section className={scss.NewPasswordPage}>
      <button
        type="button"
        className={scss.backButton}
        onClick={handleBack}
        aria-label="Назад"
      >
        <Image src={backIcon} alt="Назад" width={24} height={24} />
      </button>
      <Image src={logo} alt="Логотип ReaLab" className={scss.logo} priority width={136} height={96} />

      <h1>Новый пароль</h1>
      <p>Создайте новый пароль</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <label>
          <input
            type="password"
            placeholder="Пароль"
            autoComplete="new-password"
            {...register("newPassword", {
              required: "Введите пароль",
              minLength: {
                value: 6,
                message: "Минимум 6 символов",
              },
            })}
          />
          <HiOutlineLockClosed />
        </label>
        {errors.newPassword && <span>{errors.newPassword.message}</span>}

        <label>
          <input
            type="password"
            placeholder="Подтвердите пароль"
            autoComplete="new-password"
            {...register("confirmPassword", {
              required: "Подтвердите пароль",
            })}
          />
          <HiOutlineLockClosed />
        </label>
        {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
        {submitError && <span>{submitError}</span>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Сохранение..." : "Продолжить"}
        </button>
      </form>

      <div className={scss.resendWrap}>
        <span>Не получили код?</span>
        <button type="button" onClick={handleResend} disabled={isResendLoading}>
          Повторить
        </button>
      </div>

      {resendError && <span className={scss.error}>{resendError}</span>}
    </section>
  );
};

export default NewPasswordPage;
