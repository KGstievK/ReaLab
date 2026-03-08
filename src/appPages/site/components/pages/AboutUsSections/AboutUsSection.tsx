"use client";

import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import scss from "./AboutUsSection.module.scss";
import { useGetAboutUsQuery } from "../../../../../redux/api/product";
import logoFallback from "@/assets/icons/logo.svg";
import aboutImg1 from "@/assets/images/aboutImg1.svg";
import aboutImg2 from "@/assets/images/AboutImg2.svg";
import aboutImg3 from "@/assets/images/AboutImg3.svg";
import AboutRecommendations from "./recommendations/AboutRecommendations";

interface IAbout {
  img: string;
  title: string;
  text: string;
}

const fallbackBlocks: IAbout[] = [
  {
    img: aboutImg1.src,
    title: "О бренде",
    text:
      "Мы — интернет-магазин, который создаёт одежду для мусульманских женщин, объединяя традиции с современными модными тенденциями. Наша цель — предложить вам комфортную, стильную и качественную одежду, которая подчеркнёт вашу индивидуальность, сохраняя скромность.",
  },
  {
    img: aboutImg2.src,
    title: "Наша миссия:",
    text:
      "Мы верим, что одежда — это не просто вещи. Это отражение вашей личности, гармонии и ценностей. Наши коллекции созданы с уважением к культуре и заботой о вашем комфорте.",
  },
  {
    img: aboutImg3.src,
    title: "Наши ценности:",
    text:
      "Это гармония традиций, качество и забота о каждой женщине, подчеркивающая её индивидуальность и стиль.",
  },
];

const resolveImageSrc = (img: string | StaticImageData | undefined) => {
  if (!img) {
    return "";
  }

  if (typeof img === "string") {
    return img;
  }

  return img.src;
};

const AboutUsSection = () => {
  const { data } = useGetAboutUsQuery();
  const aboutData = data?.[0];

  const rawBlocks = aboutData?.about_me ?? [];
  const aboutBlocks = rawBlocks.length > 0 ? rawBlocks : fallbackBlocks;

  const firstBlock = aboutBlocks[0];
  const detailBlocks = aboutBlocks.slice(1, 3);

  const heroLogo: string | StaticImageData = aboutData?.logo || logoFallback;
  const heroMade = aboutData?.made || "MADE IN KYRGYZSTAN";
  const heroTitle =
    aboutData?.title || "Мы олицетворяем элегантность и скромность";

  return (
    <section className={scss.aboutPage}>
      <div className={scss.mobileBreadcrumbsBar}>
        <div className="container">
          <div className={scss.breadcrumbs}>
            <Link href="/">Главная</Link>
            <span>/</span>
            <span>О нас</span>
          </div>
        </div>
      </div>

      <div className="container">
        <section className={scss.heroSection}>
          <div className={scss.heroContent}>
            <Image
              width={172}
              height={106}
              src={heroLogo}
              alt="Jumana logo"
              className={scss.heroLogo}
            />
            <p>{heroMade}</p>
            <h1>{heroTitle}</h1>
          </div>
        </section>
      </div>

      {firstBlock && (
        <section className={`${scss.storySection} ${scss.storySectionMuted}`}>
          <div className="container">
            <div className={`${scss.storyContent} ${scss.imageFirst}`}>
              <div className={scss.storyMedia}>
                <img src={resolveImageSrc(firstBlock.img)} alt={firstBlock.title} />
              </div>
              <div className={scss.storyText}>
                <h2>{firstBlock.title}</h2>
                <p>{firstBlock.text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {detailBlocks.length > 0 && (
        <section className={scss.detailsSection}>
          <div className="container">
            {detailBlocks.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                className={`${scss.storyContent} ${
                  idx % 2 === 0 ? scss.textFirst : scss.imageFirst
                } ${scss.detailRow}`}
              >
                <div className={scss.storyMedia}>
                  <img src={resolveImageSrc(item.img)} alt={item.title} />
                </div>
                <div className={scss.storyText}>
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AboutRecommendations />
    </section>
  );
};

export default AboutUsSection;
