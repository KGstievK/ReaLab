"use client";

import scss from "./SignUpPage.module.scss";
import { usePostRegistrationMutation } from "../../../../redux/api/auth";
import { ConfigProvider } from "antd";
import { FC, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Checkbox, { CheckboxChangeEvent } from "antd/es/checkbox";
import Link from "next/link";
import Image from "next/image";
const logo = "/media/branding/realab-mark.svg";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAuthTokens, saveAuthTokens } from "@/utils/authStorage";
import { executePendingAuthIntent } from "@/utils/authIntent";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";
import { useDispatch } from "react-redux";
import { api } from "@/redux/api";

interface SignUpProps {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

const signUpSignals = [
  { title: "B2B start", text: "Подготовьте профиль для корзины, коммерческих запросов и закупочного цикла." },
  { title: "Return flow", text: "После регистрации пользователь возвращается в нужный сценарий ReaLab." },
  { title: "Medical context", text: "Аккаунт сразу встраивается в витрину медицинского оборудования, а не в generic shop." },
];

const SignUpPage: FC = () => {
  const [postRegisterMutation] = usePostRegistrationMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<AUTH.PostRegistrationRequest>();

  const [rememberMe, setRememberMe] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitTraceId, setSubmitTraceId] = useState("");
  const nextPath = searchParams.get("next");
  const fromPath = searchParams.get("from");
  const intentType = searchParams.get("intent");
  const hardMode = searchParams.get("hard") === "1";
  const redirectPath =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("/auth")
      ? nextPath
      : "/";
  const safeFromPath = fromPath && fromPath.startsWith("/") ? fromPath : null;

  const authFlowPath = (path: string) => {
    const params = new URLSearchParams();

    if (nextPath) {
      params.set("next", nextPath);
    }

    if (safeFromPath) {
      params.set("from", safeFromPath);
    }

    if (intentType) {
      params.set("intent", intentType);
    }

    if (hardMode) {
      params.set("hard", "1");
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  const handleRememberMeChange = (event: CheckboxChangeEvent) => {
    setRememberMe(event.target.checked);
  };

  const closeAuthAndRedirect = (path: string) => {
    router.replace(path);
    router.refresh();

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (window.location.pathname.startsWith("/auth")) {
          window.location.replace(path);
        }
      }, 120);
    }
  };

  const onSubmit: SubmitHandler<SignUpProps> = async (userData) => {
    setSubmitError("");
    setSubmitTraceId("");

    if (userData.password !== userData.confirm_password) {
      setSubmitError("Пароли не совпадают");
      return;
    }

    try {
      const response = await postRegisterMutation({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirm_password,
      }).unwrap();

      if (response.access && rememberMe) {
        dispatch(api.util.resetApiState());
        saveAuthTokens(response, true);
        const intentPath =
          intentType === "favorite_add" ? await executePendingAuthIntent() : null;
        closeAuthAndRedirect(intentPath || redirectPath);
        return;
      }

      clearAuthTokens();
      router.replace(authFlowPath("/auth/sign-in"));
    } catch (error: any) {
      const apiError = extractApiErrorInfo(error, "Не удалось зарегистрировать пользователя");
      const firstFieldError = Object.values(apiError.fields)[0];

      setSubmitError(
        apiError.code === "RATE_LIMITED" || apiError.status === 429
          ? getRateLimitAwareMessage(
              apiError,
              "Слишком много попыток регистрации. Попробуйте позже.",
            )
          : firstFieldError || apiError.message,
      );
      setSubmitTraceId(apiError.traceId || "");

      console.error("Registration failed:", error);
    }
  };

  return (
    <section className={scss.RegistrationPage}>
      <Link href="/" className={scss.Logo}>
        <Image src={logo} alt="Логотип ReaLab" width={136} height={96} />
      </Link>
      <div className={scss.headerBlock}>
        <span className={scss.eyebrow}>REA LAB ONBOARDING</span>
        <h1>Создать аккаунт</h1>
        <p className={scss.lead}>
          Зарегистрируйте доступ к procurement-ready витрине ReaLab и продолжите
          сценарий выбора, заказа или оснащения без потери контекста.
        </p>
      </div>
      <div className={scss.signalGrid}>
        {signUpSignals.map((item) => (
          <article key={item.title} className={scss.signalCard}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </article>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          {...register("username", { required: true })}
          placeholder="Имя аккаунта"
          aria-invalid={errors.username ? "true" : "false"}
        />
        {errors.username?.type === "required" && (
          <p role="alert">*Придумайте имя пользователя</p>
        )}

        <input
          type="text"
          {...register("email", { required: true })}
          placeholder="E-mail"
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email?.type === "required" && (
          <p role="alert">*Введите ваш адрес электронной почты</p>
        )}

        <input
          type="password"
          {...register("password", { required: true })}
          placeholder="Пароль"
          aria-invalid={errors.password ? "true" : "false"}
        />
        {errors.password?.type === "required" && (
          <p role="alert">*Придумайте пароль</p>
        )}

        <input
          type="password"
          {...register("confirm_password", { required: true })}
          placeholder="Повторите пароль"
          aria-invalid={errors.confirm_password ? "true" : "false"}
        />
        {errors.confirm_password?.type === "required" && (
          <p role="alert">*Повторите пароль</p>
        )}

        {submitError && <p role="alert">{submitError}</p>}
        {submitTraceId && <p className={scss.traceHint}>ID запроса: {submitTraceId}</p>}

        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "transparent",
              colorBorder: "#000",
            },
          }}
        >
          <Checkbox
            className={scss.customCheckbox}
            onChange={handleRememberMeChange}
          >
            Сохранить вход
          </Checkbox>
        </ConfigProvider>

        <button type="submit">Зарегистрироваться</button>
      </form>

      <div className={scss.links}>
        <p>У вас уже есть аккаунт?</p>
        <Link href={authFlowPath("/auth/sign-in")} className={scss.link}>
          Войти
        </Link>
      </div>
    </section>
  );
};

export default SignUpPage;
