import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import scss from "./Header.module.scss";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/icons/logo.svg";
import profile from "@/assets/icons/Profile.svg";
import cart from "@/assets/icons/cart.svg";
import Search from "../../ui/Search/Search";
import { getStoredAccessToken } from "../../../../../utils/authStorage";

const Header = () => {
  const pathname = usePathname();
  const isProfileRoute = pathname.startsWith("/profile");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileHeaderHidden, setIsMobileHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const links = [
    { link: "/", name: "Главная" },
    { link: "/new", name: "Новинки" },
    { link: "/catalog", name: "Категории" },
    { link: "/about", name: "О нас" },
    { link: "/contacts", name: "Контакты" },
  ];

  const safeFromPath = pathname && pathname.startsWith("/") ? pathname : "/";
  const buildSignInHref = (nextPath: string) =>
    `/auth/sign-in?next=${encodeURIComponent(nextPath)}&from=${encodeURIComponent(safeFromPath)}`;

  const profileHref = isAuthenticated ? "/profile" : buildSignInHref("/profile");
  const cartHref = isAuthenticated ? "/cart" : buildSignInHref("/cart");

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(getStoredAccessToken()));
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 750px)");
    const scrollThreshold = 10;

    const syncHeaderState = () => {
      if (!mediaQuery.matches) {
        setIsMobileHeaderHidden(false);
      }

      lastScrollY.current = Math.max(window.scrollY, 0);
    };

    const updateHeaderVisibility = () => {
      animationFrameId.current = null;

      if (!mediaQuery.matches) {
        setIsMobileHeaderHidden(false);
        return;
      }

      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 12) {
        setIsMobileHeaderHidden(false);
      } else if (scrollDelta > scrollThreshold) {
        setIsMobileHeaderHidden(true);
      } else if (scrollDelta < -scrollThreshold) {
        setIsMobileHeaderHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const onScroll = () => {
      if (animationFrameId.current !== null) {
        return;
      }

      animationFrameId.current = window.requestAnimationFrame(updateHeaderVisibility);
    };

    syncHeaderState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncHeaderState);
    mediaQuery.addEventListener("change", syncHeaderState);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncHeaderState);
      mediaQuery.removeEventListener("change", syncHeaderState);

      if (animationFrameId.current !== null) {
        window.cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <header className={`${scss.Header} ${isMobileHeaderHidden ? scss.mobileHidden : ""}`}>
      <div className="container">
        <div className={scss.content}>
          <div className={scss.Logo}>
            <Link href="/">
              <Image src={logo} alt="Logo" />
            </Link>
          </div>

          <div className={scss.Search}>
            {!isProfileRoute && <Search />}
          </div>

          <nav className={scss.nav}>
            <ul>
              {links.map((item) => (
                <li key={item.link}>
                  <Link href={item.link} className={pathname === item.link ? scss.active : ""}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={scss.profile_cart}>
            {!isProfileRoute && <Search />}
            <Link href={profileHref} aria-label={"Профиль"}>
              <Image src={profile} alt="Profile" />
            </Link>
            <Link href={cartHref} aria-label={"Корзина"}>
              <Image src={cart} alt="Cart" />
            </Link>
          </div>

          <div className={scss.burgerMenu}></div>
        </div>
      </div>
    </header>
  );
};

export default Header;

