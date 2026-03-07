"use client";

import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import scss from "./AboutUsSection.module.scss";
import { useGetAboutUsQuery } from "../../../../../redux/api/product";
import logoFallback from "@/assets/icons/logo.svg";
import AboutRecommendations from "./recommendations/AboutRecommendations";

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

  const heroLogo: string | StaticImageData = aboutData?.logo || logoFallback;

  return (
    <section className={scss.aboutPage}>
      <div className={`${scss.breadcrumbsBar} ${scss.desktopBreadcrumbsBar}`}>
        <div className="container">
          <div className={scss.breadcrumbs}>
            <Link href="/">Главная</Link>
            <span>/</span>
            <span>О нас</span>
          </div>
        </div>
      </div>

      <div className={`${scss.breadcrumbsBar} ${scss.mobileBreadcrumbsBar}`}>
        <div className="container">
          <div className={scss.breadcrumbs}>
            <Link href="/">Главная</Link>
            <span>/</span>
            <span>О нас</span>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={scss.aboutTop}>
          <section className={scss.heroSection}>
            <div className={scss.heroContent}>
              <Image width={140} height={90} src={heroLogo} alt="Jumana logo" />
              <p>{aboutData?.made || "MADE IN KYRGYZSTAN"}</p>
              <h1>
                {aboutData?.title ||
                  "Мы олицетворяем элегантность и скромность"}
              </h1>
            </div>
          </section>
        </div>
      </div>

      {firstBlock && (
        <section className={`${scss.storySection} ${scss.storySectionMuted}`}>
          <div className="container">
            <div className={`${scss.storyContent} ${scss.imageFirst}`}>
              <div className={scss.storyMedia}>
                <img src={firstBlock.img} alt={firstBlock.title} />
              </div>
              <div className={scss.storyText}>
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
                <img src={item.img} alt={item.title} />
              </div>
              <div className={scss.storyText}>
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
