"use client";

import { FC, ReactNode, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGetMeQuery } from "../redux/api/auth";
import {
  clearAuthTokens,
  getStoredAuthBundle,
  isJwtExpired,
} from "../utils/authStorage";

interface SessionProviderProps {
  children: ReactNode;
}

const AUTH_PAGES = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/reset_password",
  "/auth/new_password",
  "/auth/reset_success",
  "/auth/forgot",
];
const LAST_PUBLIC_PATH_KEY = "jumana:last_public_path";

const normalizePathname = (pathname: string): string => pathname.toLowerCase();
const isSafePath = (path?: string | null): path is string =>
  Boolean(path && path.startsWith("/"));

const isProtectedPath = (pathname: string): boolean => {
  const normalized = normalizePathname(pathname);
  const isProfilePath =
    normalized.startsWith("/profile") || normalized.startsWith("/profil");
  const isFavorite =
    normalized === "/favorite" || normalized.endsWith("/favorite");

  return (
    normalized.startsWith("/admin") ||
    isProfilePath ||
    normalized.startsWith("/cart") ||
    isFavorite
  );
};

const isAuthPath = (pathname: string): boolean =>
  AUTH_PAGES.includes(normalizePathname(pathname));

const getPublicFromPath = (pathname: string): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  const storedPath = sessionStorage.getItem(LAST_PUBLIC_PATH_KEY);
  if (
    isSafePath(storedPath) &&
    !isProtectedPath(storedPath) &&
    !isAuthPath(storedPath)
  ) {
    return storedPath;
  }

  if (isSafePath(pathname) && !isProtectedPath(pathname) && !isAuthPath(pathname)) {
    return pathname;
  }

  return "/";
};

const buildSignInHref = (nextPath: string, fromPath: string): string => {
  const safeNext = isSafePath(nextPath) ? nextPath : "/";
  const safeFrom = isSafePath(fromPath) ? fromPath : "/";
  const params = new URLSearchParams();
  params.set("next", safeNext);
  params.set("from", safeFrom);
  return `/auth/sign-in?${params.toString()}`;
};

export const SessionProvider: FC<SessionProviderProps> = ({ children }) => {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const normalizedPath = normalizePathname(pathname);
  const { tokens } = getStoredAuthBundle();
  const hasValidAccessToken = Boolean(
    tokens?.access && !isJwtExpired(tokens.access),
  );
  const hasValidRefreshToken = Boolean(
    tokens?.refresh && !isJwtExpired(tokens.refresh),
  );
  const hasActiveSession = hasValidAccessToken || hasValidRefreshToken;

  const { status, data: profile } = useGetMeQuery(undefined, {
    skip: !hasActiveSession,
  });

  const handleNavigation = useCallback(() => {
    const signInHref = buildSignInHref(pathname, getPublicFromPath(pathname));
    const isAuthPage = isAuthPath(normalizedPath);
    const isProtectedPage = isProtectedPath(pathname);
    const isAdminPage = normalizedPath.startsWith("/admin");
    const profileRole = profile?.[0]?.role;
    const isAdminUser =
      profileRole === "admin" ||
      profileRole === "manager" ||
      profileRole === "owner";

    if (isAuthPage && status === "fulfilled") {
      if (typeof window !== "undefined") {
        const nextPath = new URLSearchParams(window.location.search).get("next");
        if (isSafePath(nextPath) && !isAuthPath(nextPath)) {
          router.replace(nextPath);
          return;
        }
      }
      router.replace("/");
      return;
    }

    if (isProtectedPage && !hasActiveSession) {
      clearAuthTokens();
      router.replace(signInHref);
      return;
    }

    // At this point refresh is already handled centrally in baseQueryExtended.
    // Rejected status on protected routes means session is no longer valid.
    if (isProtectedPage && status === "rejected") {
      clearAuthTokens();
      router.replace(signInHref);
      return;
    }

    if (isAdminPage && status === "fulfilled" && !isAdminUser) {
      router.replace("/");
    }
  }, [hasActiveSession, normalizedPath, pathname, profile, router, status]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!isProtectedPath(pathname) && !isAuthPath(pathname)) {
      sessionStorage.setItem(LAST_PUBLIC_PATH_KEY, pathname);
    }
  }, [pathname]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  return children;
};
