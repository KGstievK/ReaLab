import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GoHome, GoHomeFill } from "react-icons/go";
import {
  HiOutlineViewGrid,
  HiOutlineShoppingCart,
  HiOutlineUser,
} from "react-icons/hi";
import { HiViewGrid, HiShoppingCart, HiUser } from "react-icons/hi";
import { getStoredAccessToken } from "../../../../../utils/authStorage";
import s from "./TabBAr.module.scss";

const Tabbar = () => {
  const pathname = usePathname();
  const isAuthenticated = Boolean(getStoredAccessToken());
  const safeFromPath = pathname && pathname.startsWith("/") ? pathname : "/";
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const buildSignInHref = (nextPath: string) =>
    `/auth/sign-in?next=${encodeURIComponent(nextPath)}&from=${encodeURIComponent(safeFromPath)}`;

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) {
        return;
      }

      ticking.current = true;
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY.current;

        if (currentScrollY <= 10) {
          setIsVisible(true);
        } else if (scrollDelta > 6) {
          setIsVisible(false);
        } else if (scrollDelta < -6) {
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tabs = [
    {
      name: "Главная",
      icon: <GoHome />,
      activeIcon: <GoHomeFill />,
      link: "/",
    },
    {
      name: "Категории",
      icon: <HiOutlineViewGrid />,
      activeIcon: <HiViewGrid />,
      link: "/catalog",
    },
    {
      name: "Корзина",
      icon: <HiOutlineShoppingCart />,
      activeIcon: <HiShoppingCart />,
      link: isAuthenticated ? "/cart" : buildSignInHref("/cart"),
    },
    {
      name: "Профиль",
      icon: <HiOutlineUser />,
      activeIcon: <HiUser />,
      link: isAuthenticated ? "/profile" : buildSignInHref("/profile"),
    },
  ];

  return (
    <div className={`${s.TabBar} ${isVisible ? s.show : s.hide}`}>
      <div className="container">
        <div className={s.content}>
          {tabs.map((tab) => (
            <div className={s.block} key={tab.name}>
              <Link href={tab.link}>
                {pathname === tab.link ? (
                  <span className={s.active}>{tab.activeIcon}</span>
                ) : (
                  <span>{tab.icon}</span>
                )}
                <h4
                  style={{
                    color: pathname === tab.link ? "#A40011" : "#616161",
                  }}
                >
                  {tab.name}
                </h4>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tabbar;
