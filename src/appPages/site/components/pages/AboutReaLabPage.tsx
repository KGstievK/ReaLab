"use client";

import Image from "next/image";
import Link from "next/link";
import { FiActivity, FiCpu, FiLifeBuoy, FiShield } from "react-icons/fi";
import { useGetAboutUsQuery } from "@/redux/api/product";
import { resolveMediaUrl } from "@/utils/media";
import scss from "./AboutReaLabPage.module.scss";

const hasEncodingArtifacts = (value?: string | null) => Boolean(value && /(?:Р.|С.){3,}/.test(value));

const pickCleanText = (value: string | null | undefined, fallback: string) =>
  value && !hasEncodingArtifacts(value) ? value : fallback;

const metrics = [
  { value: "6", label: "направлений клинического оборудования" },
  { value: "1", label: "единая storefront- и admin-система" },
  { value: "24/7", label: "готовность к запросу коммерческого предложения" },
];

const pillars = [
  {
    icon: <FiCpu />,
    title: "Инженерный каталог",
    text: "Оборудование подается через реальные сценарии отделения, а не через декоративный рекламный слой.",
  },
  {
    icon: <FiShield />,
    title: "Закупочная прозрачность",
    text: "На одной поверхности видны категории, конфигурации, остатки, условия поставки и вход в procurement-flow.",
  },
  {
    icon: <FiLifeBuoy />,
    title: "Сервис после сделки",
    text: "ReaLab думает о вводе в эксплуатацию, обучении и сопровождении, а не только о продаже коробки.",
  },
];

const AboutReaLabPage = () => {
  const { data } = useGetAboutUsQuery();
  const aboutData = data?.[0];
  const aboutBlocks = aboutData?.about_me ?? [];
  const heroLogo = aboutData?.logo
    ? resolveMediaUrl(aboutData.logo)
    : "/media/branding/realab-mark.svg";
  const heroEyebrow = pickCleanText(aboutData?.made, "Reaction Lab for Medtech");
  const heroTitle = pickCleanText(
    aboutData?.title,
    "ReaLab перестраивает e-commerce под медицинское оборудование и clinical-first UX.",
  );

  return (
    <section className={scss.page}>
      <div className="container">
        <div className={scss.hero}>
          <div className={scss.heroCopy}>
            <span className={scss.eyebrow}>{heroEyebrow}</span>
            <div className={scss.logoWrap}>
              <Image src={heroLogo} alt="ReaLab" width={144} height={104} />
            </div>
            <h1>{heroTitle}</h1>
            <p>
              Мы проектируем мягкую, тактильную и понятную digital-среду для клиник,
              лабораторий и реабилитационных центров. В фокусе не просто красивый
              storefront, а удобство выбора, закупки и сопровождения оборудования.
            </p>

            <div className={scss.actions}>
              <Link href="/catalog" className={scss.primaryAction}>
                Смотреть каталог
              </Link>
              <Link href="/contacts" className={scss.secondaryAction}>
                Связаться с командой
              </Link>
            </div>
          </div>

          <div className={scss.heroAside}>
            <div className={scss.hexField} aria-hidden="true">
              {Array.from({ length: 10 }).map((_, index) => (
                <span key={index} className={scss.hex} />
              ))}
            </div>

            <div className={scss.metrics}>
              {metrics.map((item) => (
                <article key={item.label} className={scss.metricCard}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <section className={scss.pillars}>
          <div className={scss.sectionHeader}>
            <span>Подход</span>
            <h2>Платформа строится вокруг решений закупочной и клинической команды.</h2>
          </div>

          <div className={scss.pillarGrid}>
            {pillars.map((item) => (
              <article key={item.title} className={scss.pillarCard}>
                <div className={scss.iconWrap}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {aboutBlocks.length ? (
          <section className={scss.storyGrid}>
            {aboutBlocks.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className={`${scss.storyCard} ${index === 0 ? scss.storyFeatured : ""}`}
              >
                <div className={scss.storyMedia}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveMediaUrl(item.img)} alt={pickCleanText(item.title, "ReaLab")} />
                </div>
                <div className={scss.storyBody}>
                  <span>{index === 0 ? "Система" : "Контентный блок"}</span>
                  <h3>{pickCleanText(item.title, "ReaLab block")}</h3>
                  <p>{pickCleanText(item.text, "Контентный блок для медицинской витрины ReaLab.")}</p>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <section className={scss.note}>
          <div>
            <span className={scss.eyebrow}>ReaLab Note</span>
            <h2>Новая ниша получила не только visual rebrand, но и другую продуктовую логику.</h2>
          </div>
          <div className={scss.noteMeta}>
            <FiActivity />
            <p>
              Каталог, карточки, seed-данные, CMS-тексты и admin-слой перестроены под
              медицинское оборудование, клинические сценарии и procurement-ready подачу.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
};

export default AboutReaLabPage;
