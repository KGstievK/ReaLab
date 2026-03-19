"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import scss from "./AuthDesktopModal.module.scss";

type AuthDesktopModalMode = "intercept" | "page";

interface AuthDesktopModalProps {
  children: ReactNode;
  mode?: AuthDesktopModalMode;
}

const AuthDesktopModal: FC<AuthDesktopModalProps> = ({
  children,
  mode = "intercept",
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  const handleClose = () => {
    router.back();
  };

  const renderModal = (
    overlayClassName = scss.overlay,
    modalClassName = scss.modal,
    closeButtonClassName = scss.closeButton
  ) => (
    <div className={overlayClassName} onClick={handleClose}>
      <div className={modalClassName} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={closeButtonClassName}
          onClick={handleClose}
          aria-label="Закрыть окно авторизации"
        >
          x
        </button>
        {children}
      </div>
    </div>
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);
    const listener = (event: MediaQueryListEvent) => handleChange(event);
    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  useEffect(() => {
    if (mode !== "intercept") {
      return;
    }

    if (!isMobile) {
      return;
    }

    const fullPath = `${window.location.pathname}${window.location.search}`;
    window.location.assign(fullPath);
  }, [isMobile, mode]);

  useEffect(() => {
    if (mode !== "page" || isMobile !== false) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");

    if (!from || !from.startsWith("/") || from.startsWith("/auth")) {
      return;
    }

    const currentPath = `${window.location.pathname}${window.location.search}`;
    const recoveryKey = `auth-modal-recovery:${currentPath}`;

    if (sessionStorage.getItem(recoveryKey) === "done") {
      sessionStorage.removeItem(recoveryKey);
      return;
    }

    sessionStorage.setItem(recoveryKey, "done");
    router.replace(from);

    window.setTimeout(() => {
      router.push(currentPath);
    }, 50);
  }, [isMobile, mode, router]);

  if (mode === "page") {
    return renderModal(
      `${scss.overlay} ${scss.pageOverlay}`,
      `${scss.modal} ${scss.pageModal}`,
      `${scss.closeButton} ${scss.pageCloseButton}`
    );
  }

  if (isMobile) {
    return null;
  }

  return renderModal();
};

export default AuthDesktopModal;
