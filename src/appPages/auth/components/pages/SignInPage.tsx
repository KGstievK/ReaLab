"use client";

import scss from "./SignInPage.module.scss";
import { usePostLoginMutation } from "../../../../redux/api/auth";
import Checkbox, { CheckboxChangeEvent } from "antd/es/checkbox";
import { ConfigProvider } from "antd";
import Image from "next/image";
import Link from "next/link";
import { FC, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import logo from "@/assets/icons/logo.svg";
import google from "@/assets/icons/google.svg";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAuthTokens } from "@/utils/authStorage";
import { executePendingAuthIntent } from "@/utils/authIntent";
import { useDispatch } from "react-redux";
import { api } from "@/redux/api";

interface LoginProps {
  username: string;
  password: string;
}

const SignInPage: FC = () => {
  const [postLoginMutation] = usePostLoginMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AUTH.PostLoginRequest>();
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

  const onSubmit: SubmitHandler<LoginProps> = async (userData) => {
    try {
      const response = await postLoginMutation({
        username: userData.username,
        password: userData.password,
      }).unwrap();

      if (response.access) {
        dispatch(api.util.resetApiState());
        saveAuthTokens(response, rememberMe);
      }

      const intentPath =
        intentType === "favorite_add" ? await executePendingAuthIntent() : null;
      closeAuthAndRedirect(intentPath || redirectPath);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <section className={scss.LoginPage}>
      <Link href="/" className={scss.Logo}>
        <Image src={logo} alt="LOGO" />
      </Link>
      <h1>Войти в аккаунт</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          placeholder="User Name"
          {...register("username", { required: true })}
          aria-invalid={errors.username ? "true" : "false"}
        />
        {errors.username?.type === "required" && (
          <p role="alert">*Введите имя пользователя</p>
        )}

        <input
          type="password"
          placeholder="Password"
          {...register("password", { required: true })}
          aria-invalid={errors.password ? "true" : "false"}
        />
        {errors.password && <p role="alert">*Введите пароль</p>}
        <div className={scss.links}>
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
          <Link href={authFlowPath("/auth/forgot")} className={scss.link}>
            Забыли пароль?
          </Link>
        </div>
        <button type="submit">Войти</button>
      </form>
      <div className={scss.orLine}>
        <div className={scss.line} />
        <p>или</p>
        <div className={scss.line} />
      </div>
      <div className={scss.google}>
        <button type="button" className={scss.Google_link}>
          <Image src={google} alt="Google" />
        </button>
      </div>
      <div className={scss.nav}>
        <p>У вас нет аккаунта?</p>
        <Link href={authFlowPath("/auth/sign-up")} className={scss.link}>
          Зарегистрироваться
        </Link>
      </div>
    </section>
  );
};

export default SignInPage;
