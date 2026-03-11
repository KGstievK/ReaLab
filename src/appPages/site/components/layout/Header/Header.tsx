import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import scss from "./Header.module.scss";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/icons/logo.svg";
import profile from "@/assets/icons/Profile.svg";
import cart from "@/assets/icons/cart.svg";
import Search from "../../ui/Search/Search";
import { getStoredAccessToken } from "../../../../../utils/authStorage";

interface HeaderProps {
  isMobileHidden?: boolean;
}

const Header = ({ isMobileHidden = false }: HeaderProps) => {
  const pathname = usePathname();
  const isProfileRoute = pathname.startsWith("/profile");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const links = [
    { link: "/", name: "Главная" },
    { link: "/new", name: "Новинки" },
    { link: "/catalog", name: "Категории" },
    { link: "/about", name: "О нас" },
    // { link: "/contacts", name: "Контакты" },
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

  return (
    <header className={`${scss.Header} ${isMobileHidden ? scss.mobileHidden : ""}`}>
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

