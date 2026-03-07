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
      return "\u041f\u0440\u043e\u0444\u0438\u043b\u044c";
    }
    if (pathname === "/profile/history") {
      return "\u041c\u043e\u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u0438";
    }
    if (pathname === "/profile/favorite") {
      return "\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u044b\u0435";
    }
    return "\u041f\u0440\u043e\u0444\u0438\u043b\u044c";
  }, [pathname]);

  const isProfileRoot = pathname === "/profile";

  return (
    <section className={scss.LayoutProfile}>
      <div className="container">
        <p className={scss.desktopBreadcrumbs}>
          <Link href={"/"}>{"\u0413\u043b\u0430\u0432\u043d\u0430\u044f"}</Link>
          <span>|</span>
          <span>{"\u041b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442"}</span>
          <span>|</span>
          <span>{sectionLabel}</span>
        </p>

        <p className={scss.mobileBreadcrumbs}>
          <Link href={"/"}>{"\u0413\u043b\u0430\u0432\u043d\u0430\u044f"}</Link>
          <span>|</span>
          <span>{sectionLabel}</span>
        </p>

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
