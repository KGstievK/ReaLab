"use client";

import scss from "./SignUpPage.module.scss";
import { usePostRegistrationMutation } from "../../../../redux/api/auth";
import { ConfigProvider } from "antd";
import { FC, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Checkbox, { CheckboxChangeEvent } from "antd/es/checkbox";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/icons/logo.svg";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAuthTokens, saveAuthTokens } from "@/utils/authStorage";
import { executePendingAuthIntent } from "@/utils/authIntent";
import { useDispatch } from "react-redux";
import { api } from "@/redux/api";

interface SignUpProps {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

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

  const handleRememberMeChange = (e: CheckboxChangeEvent) => {
    setRememberMe(e.target.checked);
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
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <section className={scss.RegistrationPage}>
      <Link href="/" className={scss.Logo}>
        <Image src={logo} alt="LOGO" />
      </Link>
      <h1>Создать аккаунт</h1>
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
