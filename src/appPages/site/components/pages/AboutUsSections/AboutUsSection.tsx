"use client";

import Link from "next/link";
import Image from "next/image";
import scss from "./AboutUsSection.module.scss";
import { useGetAboutUsQuery } from "../../../../../redux/api/product";
import logoFallback from "@/assets/icons/logo.svg";
import AboutRecommendations from "./recommendations/AboutRecommendations";
import { resolveMediaUrl } from "@/utils/media";

interface IAbout {
  img: string;
  title: string;
  text: string;
}

const AboutUsSection = () => {
  const { data } = useGetAboutUsQuery();
  const aboutData = data?.[0];
  const aboutBlocks = aboutData?.about_me ?? [];
  const firstBlock = aboutBlocks[0];
  const detailBlocks = aboutBlocks.slice(1);
  const heroLogo = aboutData?.logo ? resolveMediaUrl(aboutData.logo) : logoFallback;
  const heroHighlights = [
    aboutData?.made || "Clinical systems by ReaLab",
    "Инженерный подход к медтехнике",
    "Поставка, внедрение и сервис",
  ];

  return (
    <section className={scss.aboutPage}>
      <div className="container">
        <div className={scss.breadcrumbs}>
          <Link href="/">Главная</Link>
          <span>/</span>
          <span>О нас</span>
        </div>

        <section className={scss.heroSection}>
          <div className={scss.heroContent}>
            <div className={scss.heroCopy}>
              <span className={scss.eyebrow}>О компании ReaLab</span>
              <Image width={156} height={96} src={heroLogo} alt="ReaLab logo" />
              <p className={scss.heroLead}>{aboutData?.made || "Clinical systems by ReaLab"}</p>
              <h1>
                {aboutData?.title ||
                  "Мы проектируем поставки медицинского оборудования так, чтобы техника быстро входила в работу"}
              </h1>
              <p className={scss.heroDescription}>
                ReaLab соединяет инженерную экспертизу, клинический контекст и
                спокойный цифровой опыт. Мы думаем не только о характеристиках
                оборудования, но и о том, как быстро оно будет внедрено в реальную
                работу отделения.
              </p>
            </div>

            <aside className={scss.heroAside}>
              <h2>Основа ReaLab</h2>
              <ul>
                {heroHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                Для нас важно, чтобы каждая система была понятной для команды,
                надежной в повседневной эксплуатации и поддержанной по сервисному
                маршруту после поставки.
              </p>
            </aside>
          </div>
        </section>
      </div>

      {firstBlock && (
        <section className={`${scss.storySection} ${scss.storySectionFeatured}`}>
          <div className="container">
            <div className={`${scss.storyContent} ${scss.imageFirst}`}>
              <div className={scss.storyMedia}>
                <img src={resolveMediaUrl(firstBlock.img)} alt={firstBlock.title} />
              </div>
              <div className={scss.storyText}>
                <span className={scss.storyEyebrow}>История</span>
                <h2>{firstBlock.title}</h2>
                <p>{firstBlock.text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {detailBlocks.map((item: IAbout, idx: number) => (
        <section key={`${item.title}-${idx}`} className={scss.storySection}>
          <div className="container">
            <div
              className={`${scss.storyContent} ${
                idx % 2 === 0 ? scss.textFirst : scss.imageFirst
              }`}
            >
              <div className={scss.storyMedia}>
                <img src={resolveMediaUrl(item.img)} alt={item.title} />
              </div>
              <div className={scss.storyText}>
                <span className={scss.storyEyebrow}>Философия</span>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            </div>
          </div>
        </section>
      ))}

      <AboutRecommendations />
    </section>
  );
};

export default AboutUsSection;
