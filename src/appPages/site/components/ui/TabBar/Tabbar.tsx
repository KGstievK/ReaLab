"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GoHome, GoHomeFill } from "react-icons/go";
import { HiOutlineShoppingCart, HiOutlineUser, HiOutlineViewGrid } from "react-icons/hi";
import { HiShoppingCart, HiUser, HiViewGrid } from "react-icons/hi";
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
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY <= 10) {
          setIsVisible(true);
        } else if (delta > 6) {
          setIsVisible(false);
        } else if (delta < -6) {
          setIsVisible(true);
        }

        lastScrollY.current = currentY;
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
      href: "/",
      activePath: "/",
    },
    {
      name: "Категории",
      icon: <HiOutlineViewGrid />,
      activeIcon: <HiViewGrid />,
      href: "/catalog",
      activePath: "/catalog",
    },
    {
      name: "Корзина",
      icon: <HiOutlineShoppingCart />,
      activeIcon: <HiShoppingCart />,
      href: isAuthenticated ? "/cart" : buildSignInHref("/cart"),
      activePath: "/cart",
    },
    {
      name: "Профиль",
      icon: <HiOutlineUser />,
      activeIcon: <HiUser />,
      href: isAuthenticated ? "/profile" : buildSignInHref("/profile"),
      activePath: "/profile",
    },
  ];

  const isTabActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname?.startsWith(path);
  };

  return (
    <div className={`${s.TabBar} ${isVisible ? s.show : s.hide}`}>
      <div className="container">
        <div className={s.content}>
          {tabs.map((tab) => {
            const active = isTabActive(tab.activePath);

            return (
              <div className={s.block} key={tab.name}>
                <Link href={tab.href}>
                  {active ? <span className={s.active}>{tab.activeIcon}</span> : <span>{tab.icon}</span>}
                  <h4 style={{ color: active ? "#a73539" : "#616161" }}>{tab.name}</h4>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tabbar;
