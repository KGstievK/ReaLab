import { FC, ReactNode, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "./Header/HeaderProfile";
import scss from "./LayoutProfile.module.scss";

interface LayoutProfileProps {
  children: ReactNode;
}

const LayoutProfile: FC<LayoutProfileProps> = ({ children }) => {
  const pathname = usePathname();

  const sectionLabel = useMemo(() => {
    if (pathname === "/profile" || pathname === "/profile/my_office") {
      return "Профиль";
    }
    if (pathname === "/profile/history") {
      return "Мои покупки";
    }
    if (pathname === "/profile/favorite") {
      return "Избранные";
    }
    return "Профиль";
  }, [pathname]);

  const isProfileRoot = pathname === "/profile";

  return (
    <section className={scss.LayoutProfile}>
      <div className="container">
        <nav className={scss.desktopBreadcrumbs} aria-label="Личный кабинет">
          <Link href="/">Главная</Link>
          <span>|</span>
          <span>Личный кабинет</span>
          <span>|</span>
          <span>{sectionLabel}</span>
        </nav>

        <nav className={scss.mobileBreadcrumbs} aria-label="Личный кабинет">
          <Link href="/">Главная</Link>
          <span>|</span>
          <span>{sectionLabel}</span>
        </nav>

        <div className={scss.content}>
          <aside
            className={scss.headerMobile}
            style={{ display: isProfileRoot ? "" : "none" }}
          >
            <Header />
          </aside>

          <aside className={scss.headerDesktop}>
            <Header />
          </aside>

          <main
            className={scss.mainMobile}
            style={{ display: isProfileRoot ? "none" : "" }}
          >
            {children}
          </main>

          <main className={scss.mainDesktop}>{children}</main>
        </div>
      </div>
    </section>
  );
};

export default LayoutProfile;
