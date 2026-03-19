"use client";

import { Suspense } from "react";
import Link from "next/link";
import SideBar from "./sideBar/SideBar";
import scss from "./CatalogSection.module.scss";

const highlights = [
  "Мониторинг пациентов, диагностика и лабораторные системы",
  "Светлая neumorphic-витрина без визуального шума",
  "Поставка, запуск и сервисная поддержка",
];

const CatalogSection = () => {
  return (
    <section className={scss.CatalogSection}>
      <div className="container">
        <div className={scss.header}>
          <Link href="/">Главная</Link>
          <span>/</span>
          <Link href="/catalog">Каталог</Link>
        </div>

        <div className={scss.hero}>
          <div className={scss.heroCopy}>
            <span className={scss.eyebrow}>Каталог ReaLab</span>
            <h1 className={scss.title}>Каталог</h1>
            <p className={scss.subtitle}>
              Медицинское оборудование для клиник, лабораторий и реанимационных
              отделений. Подбирайте решения по направлению, конфигурации, исполнению и
              бюджету без потери контекста.
            </p>
          </div>

          <div className={scss.heroMeta}>
            {highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

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
