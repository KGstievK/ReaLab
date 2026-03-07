"use client";

import Image from "next/image";
import Link from "next/link";
import backIcon from "@/assets/icons/backIcon.svg";
import SideBar from "./sideBar/SideBar";
import scss from "./CatalogSection.module.scss";

const CatalogSection = () => {
  return (
    <section className={scss.CatalogSection}>
      <div className="container">
        <div className={scss.header}>
          <Image src={backIcon} alt="Back" width={22} height={22} />
          <Link href="/">Главная</Link>
          <span>/</span>
          <Link href="/catalog">Категории</Link>
        </div>

        <h1 className={scss.title}>Категории</h1>

        <div className={scss.content}>
          <SideBar />
        </div>
      </div>
    </section>
  );
};

export default CatalogSection;
