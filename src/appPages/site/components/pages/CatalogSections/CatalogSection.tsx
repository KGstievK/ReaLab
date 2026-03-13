"use client";

import { Suspense } from "react";
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
          <Image src={backIcon} alt="Назад" width={22} height={22} />
          <Link href="/">Главная</Link>
          <span>/</span>
          <Link href="/catalog">Каталог</Link>
        </div>

        <h1 className={scss.title}>Каталог</h1>

        <div className={scss.content}>
          <Suspense fallback={null}>
            <SideBar />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default CatalogSection;
