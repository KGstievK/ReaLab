import { FC, MouseEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import vector from "@/assets/icons/ProfileVector.svg";
import vectorWite from "@/assets/icons/vectorWite.svg";
import { usePostLogoutMutation } from "../../../../../../../../redux/api/auth";
import { clearAuthTokens } from "../../../../../../../../utils/authStorage";
import { useDispatch } from "react-redux";
import { api } from "@/redux/api";
import scss from "./HeaderProfile.module.scss";

type TabItem = {
  label: string;
  path: string | null;
};

const LAST_PUBLIC_PATH_KEY = "jumana:last_public_path";

const isSafePublicPath = (path?: string | null): path is string => {
  if (!path || !path.startsWith("/")) {
    return false;
  }

  const normalized = path.toLowerCase();
  const isProfilePath =
    normalized.startsWith("/profile") || normalized.startsWith("/profil");
  const isFavoritePath =
    normalized === "/favorite" || normalized.endsWith("/favorite");

  return (
    !normalized.startsWith("/auth") &&
    !normalized.startsWith("/admin") &&
    !normalized.startsWith("/cart") &&
    !isProfilePath &&
    !isFavoritePath
  );
};

const desktopTabs: TabItem[] = [
  { label: "Профиль", path: "/profile" },
  {
    label: "Мои покупки",
    path: "/profile/history",
  },
  {
    label: "Избранные",
    path: "/profile/favorite",
  },
  { label: "Выйти", path: null },
];

const mobileTabs: TabItem[] = [
  {
    label: "Профиль",
    path: "/profile/my_office",
  },
  {
    label: "Мои покупки",
    path: "/profile/history",
  },
  {
    label: "Избранные",
    path: "/profile/favorite",
  },
  { label: "Выйти", path: null },
];

const HeaderProfile: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [logoutMutation] = usePostLogoutMutation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false);

  const isActive = (path: string | null) => {
    if (!path) {
      return false;
    }

    if (path === "/profile" || path === "/profile/my_office") {
      return pathname === "/profile" || pathname === "/profile/my_office";
    }

    return pathname === path;
  };

  useEffect(() => {
    if (!isLogoutModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLogoutModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLogoutModalOpen]);

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      dispatch(api.util.resetApiState());
      clearAuthTokens();

      const storedPath =
        typeof window !== "undefined"
          ? sessionStorage.getItem(LAST_PUBLIC_PATH_KEY)
          : null;
      const redirectPath = isSafePublicPath(storedPath) ? storedPath : "/";

      router.replace(redirectPath);
      router.refresh();

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          if (
            window.location.pathname.startsWith("/profile") ||
            window.location.pathname.startsWith("/auth")
          ) {
            window.location.replace(redirectPath);
          }
        }, 120);
      }

      setIsLogoutSubmitting(false);
    }
  };

  const handleOpenLogoutModal = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsLogoutModalOpen(true);
  };

  const handleCloseLogoutModal = () => {
    if (isLogoutSubmitting) {
      return;
    }

    setIsLogoutModalOpen(false);
  };

  const handleLogoutConfirm = async () => {
    if (isLogoutSubmitting) {
      return;
    }

    setIsLogoutSubmitting(true);
    setIsLogoutModalOpen(false);
    await logout();
  };

  return (
    <header className={scss.HeaderProfile}>
      <div className={scss.content}>
        <nav className={scss.nav}>
          <ul>
            {desktopTabs.map((tab) => (
              <li key={`desktop-${tab.label}`}>
                <Link
                  href={tab.path || "/profile"}
                  onClick={tab.path ? undefined : handleOpenLogoutModal}
                >
                  <button
                    type="button"
                    className={isActive(tab.path) ? scss.active : ""}
                  >
                    {tab.label}
                    <Image
                      src={isActive(tab.path) ? vectorWite : vector}
                      alt="arrow"
                    />
                  </button>
                </Link>
              </li>
            ))}
          </ul>

          <ul>
            {mobileTabs.map((tab) => (
              <li key={`mobile-${tab.label}`}>
                <Link
                  href={tab.path || "/  "}
                  onClick={tab.path ? undefined : handleOpenLogoutModal}
                >
                  <button
                    type="button"
                    className={isActive(tab.path) ? scss.active : ""}
                  >
                    {tab.label}
                    <Image
                      src={isActive(tab.path) ? vectorWite : vector}
                      alt="arrow"
                    />
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {isLogoutModalOpen && (
        <div className={scss.logoutOverlay} onClick={handleCloseLogoutModal}>
          <div
            className={scss.logoutModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={scss.closeModalButton}
              onClick={handleCloseLogoutModal}
              aria-label={"Закрыть"}
            >
              Г-
            </button>

            <p id="logout-modal-title">
              {
                "Вы действительно хотите выйти из этой учетной записи?"
              }
            </p>

            <button
              type="button"
              className={scss.confirmLogoutButton}
              onClick={() => void handleLogoutConfirm()}
            >
              {"Выйти"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderProfile;

