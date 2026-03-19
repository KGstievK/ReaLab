"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GoHome, GoHomeFill } from "react-icons/go";
import { HiOutlineShoppingCart, HiOutlineUser, HiOutlineViewGrid } from "react-icons/hi";
import { HiShoppingCart, HiUser, HiViewGrid } from "react-icons/hi";
import { getStoredAccessToken } from "../../../../../utils/authStorage";
import s from "./TabbarReaLab.module.scss";

interface TabbarProps {
  isHidden?: boolean;
}

const TabbarReaLab = ({ isHidden = false }: TabbarProps) => {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const safeFromPath = pathname && pathname.startsWith("/") ? pathname : "/";

  const buildSignInHref = (nextPath: string) =>
    `/auth/sign-in?next=${encodeURIComponent(nextPath)}&from=${encodeURIComponent(safeFromPath)}`;

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(getStoredAccessToken()));
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);

    return () => window.removeEventListener("storage", syncAuth);
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
      name: "Каталог",
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
    <div className={`${s.TabBar} ${isHidden ? s.hide : s.show}`}>
      <div className="container">
        <div className={s.content}>
          {tabs.map((tab) => {
            const active = isTabActive(tab.activePath);

            return (
              <div className={s.block} key={tab.name}>
                <Link href={tab.href}>
                  {active ? <span className={s.active}>{tab.activeIcon}</span> : <span>{tab.icon}</span>}
                  <h4>{tab.name}</h4>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabbarReaLab;
