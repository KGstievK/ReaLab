import { usePathname } from "next/navigation";
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

  const links = [
    { link: "/", name: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f" },
    { link: "/new", name: "\u041d\u043e\u0432\u0438\u043d\u043a\u0438" },
    { link: "/catalog", name: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438" },
    { link: "/about", name: "\u041e \u043d\u0430\u0441" },
    { link: "/contacts", name: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b" },
  ];

  const isAuthenticated = Boolean(getStoredAccessToken());
  const safeFromPath = pathname && pathname.startsWith("/") ? pathname : "/";
  const buildSignInHref = (nextPath: string) =>
    `/auth/sign-in?next=${encodeURIComponent(nextPath)}&from=${encodeURIComponent(safeFromPath)}`;

  const profileHref = isAuthenticated ? "/profile" : buildSignInHref("/profile");
  const cartHref = isAuthenticated ? "/cart" : buildSignInHref("/cart");

  return (
    <header className={scss.Header}>
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
            <Link href={profileHref} aria-label={"\u041f\u0440\u043e\u0444\u0438\u043b\u044c"}>
              <Image src={profile} alt="Profile" />
            </Link>
            <Link href={cartHref} aria-label={"\u041a\u043e\u0440\u0437\u0438\u043d\u0430"}>
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
