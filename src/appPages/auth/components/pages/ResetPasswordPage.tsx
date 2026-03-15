"use client";

import scss from "./ResetPasswordPage.module.scss";
import Image from "next/image";
import logo from "@/assets/icons/logo.svg";
import backIcon from "@/assets/icons/backIcon.svg";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { usePostForgotPasswordMutation } from "../../../../redux/api/auth";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 59;

const toDigits = (value: string) => value.replace(/\D/g, "");
const formatTimer = (value: number) => `00:${String(value).padStart(2, "0")}`;

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [postForgotPassword, { isLoading }] = usePostForgotPasswordMutation();

  const contact = (searchParams.get("contact") || "").trim();
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
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!contact) {
      router.replace(buildAuthPath("/auth/forgot"));
    }
  }, [contact, router, safeFromPath, safeNextPath]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(buildAuthPath("/auth/forgot"));
  };

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timerId = window.setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [secondsLeft]);

  const updateDigit = (index: number, value: string) => {
    setDigits((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };

  const handleInputChange = (index: number, value: string) => {
    const parsed = toDigits(value);

    if (!parsed) {
      updateDigit(index, "");
      return;
    }

    if (parsed.length > 1) {
      setDigits((previous) => {
        const next = [...previous];
        const nextPart = parsed.slice(0, OTP_LENGTH - index).split("");
        nextPart.forEach((digit, offset) => {
          next[index + offset] = digit;
        });
        return next;
      });
      const targetIndex = Math.min(index + parsed.length - 1, OTP_LENGTH - 1);
      inputRefs.current[targetIndex]?.focus();
      return;
    }

    updateDigit(index, parsed);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleContinue = () => {
    const code = digits.join("");
    if (code.length !== OTP_LENGTH || !contact) {
      setSubmitError("Введите код полностью");
      return;
    }

    setSubmitError(null);
    router.push(buildAuthPath("/auth/new_password", { contact, code }));
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !contact) return;

    setResendError(null);
    setSecondsLeft(RESEND_SECONDS);

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
      setSecondsLeft(0);
    }
  };

  return (
    <section className={scss.ResetPasswordPage}>
      <button
        type="button"
        className={scss.backButton}
        onClick={handleBack}
        aria-label="Назад"
      >
        <Image src={backIcon} alt="Назад" width={24} height={24} />
      </button>
      <Image src={logo} alt="Логотип Jumana" className={scss.logo} priority />

      <h1>Подтвердите E-mail</h1>
      <p>Введите код из письма</p>

      <div className={scss.codeGroup}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            value={digit}
            maxLength={1}
            onChange={(event) => handleInputChange(index, event.target.value)}
            onKeyDown={(event) => handleInputKeyDown(event, index)}
            aria-label={`Цифра ${index + 1}`}
          />
        ))}
      </div>

      {submitError && <span className={scss.error}>{submitError}</span>}

      <button type="button" className={scss.submitButton} onClick={handleContinue}>
        Продолжить
      </button>

      <div className={scss.timer}>{formatTimer(secondsLeft)}</div>

      <div className={scss.resendWrap}>
        <span>Не получили код?</span>
        <button type="button" onClick={handleResend} disabled={secondsLeft > 0 || isLoading}>
          Повторить
        </button>
      </div>

      {resendError && <span className={scss.error}>{resendError}</span>}
    </section>
  );
};

export default ResetPasswordPage;
