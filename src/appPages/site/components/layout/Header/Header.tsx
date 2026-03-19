import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import scss from "./Header.relab.module.scss";
import Link from "next/link";
import { FiMenu, FiShoppingCart, FiUser } from "react-icons/fi";
import BurgeMenu from "../../ui/BurgeMenu/BurgeMenu";
import { getStoredAccessToken } from "../../../../../utils/authStorage";
import { useGetCartQuery } from "../../../../../redux/api/product";

interface HeaderProps {
  isMobileHidden?: boolean;
}

type HeaderCartItem = AllCart["cart_items"][number];

const links = [
  { link: "/catalog", name: "Каталог" },
  { link: "/popular", name: "Клинический выбор" },
  { link: "/new", name: "Новые решения" },
  { link: "/sale", name: "Спецусловия" },
  { link: "/about", name: "О ReaLab" },
  // { link: "/contacts", name: "Контакты" },
];

const Header = ({ isMobileHidden = false }: HeaderProps) => {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const safeFromPath = pathname && pathname.startsWith("/") ? pathname : "/";
  const buildSignInHref = (nextPath: string) =>
    `/auth/sign-in?next=${encodeURIComponent(nextPath)}&from=${encodeURIComponent(safeFromPath)}`;

  const profileHref = isAuthenticated ? "/profile" : buildSignInHref("/profile");
  const cartHref = isAuthenticated ? "/cart" : buildSignInHref("/cart");

  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });

  const cartItems = useMemo<HeaderCartItem[]>(() => {
    const normalized = Array.isArray(cartData) ? cartData[0] : cartData;
    return normalized?.cart_items || [];
  }, [cartData]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems],
  );

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(getStoredAccessToken()));
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActiveLink = (link: string) => pathname === link || pathname.startsWith(`${link}/`);

  return (
    <header className={`${scss.Header} ${isMobileHidden ? scss.mobileHidden : ""}`}>
      <div className="container">
        <div className={scss.shell}>
          <Link href="/" className={scss.brand} aria-label="ReaLab">
            <span className={scss.brandMark} aria-hidden="true">
              <span />
            </span>
            <span className={scss.brandText}>
              <strong>ReaLab</strong>
              <small>Medical Equipment</small>
            </span>
          </Link>

          <nav className={scss.nav} aria-label="Основная навигация">
            <ul>
              {links.map((item) => (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    className={isActiveLink(item.link) ? scss.active : ""}
                    aria-current={isActiveLink(item.link) ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={scss.actions}>
            <Link href="/contacts" className={scss.procurementChip}>
              B2B / Procurement
            </Link>

            <Link href={profileHref} aria-label="Профиль" className={scss.iconLink}>
              <FiUser />
            </Link>

            <Link href={cartHref} aria-label="Корзина" className={scss.iconLink}>
              <FiShoppingCart />
              {cartCount > 0 ? <span className={scss.cartBadge}>{cartCount}</span> : null}
            </Link>

            <button
              type="button"
              className={scss.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <FiMenu />
            </button>
          </div>
        </div>
      </div>

      <BurgeMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        links={links}
        profileHref={profileHref}
        cartHref={cartHref}
        isAuthenticated={isAuthenticated}
      />
    </header>
  );
};

export default Header;
