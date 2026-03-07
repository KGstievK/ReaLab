import { usePathname } from "next/navigation";
import scss from "./BurgeMenu.module.scss";
import Link from "next/link";
import { useState } from "react";

const BurgeMenu = () => {
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const pathname = usePathname();

  const links = [
    {
      link: "/",
      name: "Главная",
    },
    {
      link: "/new",
      name: "Новинки",
    },
    {
      link: "/catalog",
      name: "Категории",
    },
    {
      link: "/about",
      name: "О нас",
    },
    {
      link: "/contacts",
      name: "Контакты",
    },
  ];

  return (
    <section className={scss.BurgeMenu}>
      <div className="container">
        <div className={scss.content}>
          <div className={scss.nav}>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default BurgeMenu;
