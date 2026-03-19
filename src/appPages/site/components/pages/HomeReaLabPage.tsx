"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FiActivity,
  FiArrowRight,
  FiCpu,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import {
  useGetAllCategoryQuery,
  useGetAllClothesQuery,
  useGetEndContentQuery,
  useGetFirstSectionQuery,
  useGetSaleContentQuery,
} from "../../../../redux/api/category";
import scss from "./HomeReaLab.module.scss";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";

const hasEncodingArtifacts = (value?: string | null) => Boolean(value && /(?:Р.|С.){3,}/.test(value));

const pickCleanText = (value: string | null | undefined, fallback: string) =>
  value && !hasEncodingArtifacts(value) ? value : fallback;

const metrics = [
  { value: "120+", label: "отделений и кабинетов в demo-матрице ReaLab" },
  { value: "6", label: "направлений оборудования для клиники, лаборатории и rehab" },
  { value: "24/7", label: "готовность к коммерческому запросу, поставке и запуску" },
];

const valueCards = [
  {
    icon: <FiCpu />,
    title: "Каталог с инженерной логикой",
    text: "Карточки собраны вокруг сценария применения, конфигурации, доступности и понятного перехода к КП, а не вокруг случайного промо-шума.",
  },
  {
    icon: <FiShield />,
    title: "Документы и сервис в одном контуре",
    text: "ReaLab показывает не только продукт, но и сервисный слой: наличие, сроки, обучение, внедрение и точки входа в закупочный диалог.",
  },
  {
    icon: <FiTruck />,
    title: "Поставка под отделение, а не под витрину",
    text: "От storefront можно быстро перейти к подбору комплектации, тендерному предложению, плану запуска и следующему сервисному шагу.",
  },
];

const interfaceTags = ["ICU", "Lab", "Rehab"];

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} KGS`;

const getProductImage = (item: AllClothes) => item.clothes_img?.[0]?.photo || "";
const getProductPrice = (item: AllClothes) => Number(item.discount_price || item.price || 0);

const ProductStrip = ({
  eyebrow,
  title,
  description,
  href,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  items: AllClothes[];
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <section className={scss.productStrip}>
      <div className={scss.sectionHeader}>
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link href={href} className={scss.sectionLink}>
          Смотреть все <FiArrowRight />
        </Link>
      </div>

      <div className={scss.productGrid}>
        {items.map((item) => {
          const image = getProductImage(item);
          return (
            <Link key={item.id} href={buildProductHref(item)} className={scss.productCard}>
              <div className={scss.productVisual}>
                {image ? (
                  <Image
                    src={resolveMediaUrl(image)}
                    alt={item.clothes_name}
                    width={720}
                    height={540}
                    sizes="(max-width: 900px) 100vw, 33vw"
                  />
                ) : (
                  <div className={scss.productPlaceholder} />
                )}
              </div>
              <div className={scss.productInfo}>
                <span>{item.category_name}</span>
                <h3>{item.clothes_name}</h3>
                <div>
                  <strong>{formatPrice(getProductPrice(item))}</strong>
                  <small>{item.size?.slice(0, 2).join(" / ") || "Конфигурация уточняется"}</small>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const HomeReaLabPage = () => {
  const { data: heroResponse } = useGetFirstSectionQuery();
  const { data: categoryData = [] } = useGetAllCategoryQuery();
  const { data: popularItems = [] } = useGetAllClothesQuery({ section: "popular", limit: 3 });
  const { data: newItems = [] } = useGetAllClothesQuery({ section: "new", limit: 3 });
  const { data: saleItems = [] } = useGetAllClothesQuery({ section: "sale", limit: 3 });
  const { data: saleContentResponse } = useGetSaleContentQuery();
  const { data: endContentResponse } = useGetEndContentQuery();

  const heroData = heroResponse?.[0];
  const heroProducts = [heroData?.clothes1, heroData?.clothes2, heroData?.clothes3].filter(
    Boolean,
  ) as AllClothes[];
  const saleContent = saleContentResponse?.[0];
  const endContent = endContentResponse?.[0];
  const heroEyebrow = pickCleanText(heroData?.made, "Clinical Commerce System");
  const saleTitle = pickCleanText(
    saleContent?.title,
    "Спецусловия для проектов оснащения и тендерных поставок",
  );
  const saleDescription = pickCleanText(
    saleContent?.text,
    "Подготовим коммерческое предложение под отделение, pilot-поставку, тендер или комплексное переоснащение.",
  );
  const platformTitle = pickCleanText(endContent?.title, "Платформа ReaLab");
  const platformText = pickCleanText(
    endContent?.text,
    "Storefront, карточки, категории и admin-слой собраны так, чтобы команда клиники быстро переходила от выбора позиции к согласованию, закупке и запуску.",
  );

  return (
    <div className={scss.homePage}>
      <section className={scss.hero}>
        <div className={scss.heroCopy}>
          <span className={scss.eyebrow}>{heroEyebrow}</span>
          <h1>
            Белый clinical storefront для медицинского оборудования, построенный вокруг
            выбора, закупки и запуска.
          </h1>
          <p>
            ReaLab объединяет каталог, визуальную систему и procurement-flow в один
            спокойный интерфейс. Сложные medtech-позиции воспринимаются легко: без
            перегруза, но с ощущением точности и контроля.
          </p>

          <div className={scss.heroActions}>
            <Link href="/catalog" className={scss.primaryAction}>
              Перейти в каталог <FiArrowRight />
            </Link>
            <Link href="/contacts" className={scss.secondaryAction}>
              Запросить КП
            </Link>
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

        <div className={scss.heroVisual}>
          <div className={scss.hexBackdrop} aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index} className={scss.hex} />
            ))}
          </div>

          <article className={scss.interfaceCard}>
            <span>Clinical UI</span>
            <strong>Выбор по сценарию</strong>
            <p>Категория, конфигурация и следующий закупочный шаг на одной поверхности.</p>
            <div className={scss.interfaceTags}>
              {interfaceTags.map((item) => (
                <small key={item}>{item}</small>
              ))}
            </div>
          </article>

          {heroProducts.slice(0, 2).map((item, index) => {
            const image = getProductImage(item);
            return (
              <Link
                key={item.id}
                href={buildProductHref(item)}
                className={`${scss.heroCard} ${scss[`card${index + 1}`]}`}
              >
                <div className={scss.heroCardMedia}>
                  {image ? (
                    <Image
                      src={resolveMediaUrl(image)}
                      alt={item.clothes_name}
                      width={640}
                      height={480}
                      sizes="(max-width: 900px) 100vw, 22vw"
                    />
                  ) : (
                    <div className={scss.productPlaceholder} />
                  )}
                </div>
                <div className={scss.heroCardInfo}>
                  <span>{item.category_name}</span>
                  <strong>{item.clothes_name}</strong>
                  <small>{formatPrice(getProductPrice(item))}</small>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={scss.categories}>
        <div className={scss.sectionHeader}>
          <div>
            <span>Направления</span>
            <h2>Ниша ReaLab собрана вокруг клинических задач, а не случайного ассортимента.</h2>
          </div>
        </div>

        <div className={scss.categoryGrid}>
          {categoryData.slice(0, 6).map((item, index) => (
            <Link
              key={item.category_name}
              href={`/catalog?category=${encodeURIComponent(item.category_name)}`}
              className={`${scss.categoryCard} ${index % 3 === 1 ? scss.categoryAccent : ""}`}
            >
              <span>{String(item.count ?? 0).padStart(2, "0")}</span>
              <strong>{item.category_name}</strong>
              <small>Открыть линейку</small>
            </Link>
          ))}
        </div>
      </section>

      <section className={scss.valueSection}>
        <div className={scss.sectionHeader}>
          <div>
            <span>Почему это работает</span>
            <h2>Medtech нужен не просто каталог, а мягкая система принятия решения.</h2>
          </div>
        </div>

        <div className={scss.valueGrid}>
          {valueCards.map((item) => (
            <article key={item.title} className={scss.valueCard}>
              <div className={scss.valueIcon}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <ProductStrip
        eyebrow="Clinical Pick"
        title="Клинический выбор"
        description="Оборудование, которое лучше всего ложится на ключевые сценарии клиники, лаборатории и реабилитации."
        href="/popular"
        items={popularItems}
      />

      <ProductStrip
        eyebrow="New Systems"
        title="Новые решения"
        description="Свежие линейки и обновленные конфигурации, которые появились в витрине ReaLab."
        href="/new"
        items={newItems}
      />

      <ProductStrip
        eyebrow="Special Terms"
        title={saleTitle}
        description={saleDescription}
        href="/sale"
        items={saleItems}
      />

      <section className={scss.storyBand}>
        <article className={scss.storyCard}>
          <div className={scss.storyHeading}>
            <span>ReaLab Note</span>
            <h2>{platformTitle}</h2>
          </div>
          <p>{platformText}</p>
          <div className={scss.storyMeta}>
            <FiActivity />
            <span>Lead Product Design + UX/UI + Fullstack e-commerce adaptation</span>
          </div>
        </article>
      </section>
    </div>
  );
};

export default HomeReaLabPage;
