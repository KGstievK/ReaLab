"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiShield,
  FiTool,
} from "react-icons/fi";
import {
  useAddToBasketMutation,
  useGetCartQuery,
  useUpdateBasketMutation,
} from "@/redux/api/product";
import { useGetClothesByIdQuery } from "@/redux/api/category";
import { buildSignInHref } from "@/utils/authIntent";
import { getStoredAccessToken } from "@/utils/authStorage";
import { resolveMediaUrl } from "@/utils/media";
import ColorsClothes from "../ui/colors/Colors";
import scss from "./ProductReaLabPage.module.scss";

const hasEncodingArtifacts = (value?: string | null) => Boolean(value && /(?:Р.|С.){3,}/.test(value));

const pickCleanText = (value: string | null | undefined, fallback: string) =>
  value && !hasEncodingArtifacts(value) ? value : fallback;

const ProductRecommendations = dynamic(
  () => import("./SinglePageSections/recommendations/SinglePageRecommendations"),
  {
    loading: () => (
      <div className={scss.deferredState}>
        <p>Подбираем похожие решения...</p>
      </div>
    ),
  },
);

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} KGS`;

const benefits = [
  {
    icon: <FiShield />,
    title: "Procurement-ready подача",
    text: "Карточка подходит для быстрого перехода к КП, сравнению, внутреннему согласованию и B2B-диалогу.",
  },
  {
    icon: <FiTool />,
    title: "Сценарий внедрения",
    text: "Обсудим запуск, настройку и поддержку после поставки, если продукт идет в новый контур отделения.",
  },
  {
    icon: <FiActivity />,
    title: "Спокойный UX выбора",
    text: "Ключевые характеристики, доступность и конфигурации собраны без декоративного перегруза и пустого маркетинга.",
  },
];

const workflowSteps = [
  {
    title: "1. Согласование задачи",
    text: "Фиксируем сценарий отделения, требования по поставке и объем закупки.",
  },
  {
    title: "2. Подбор конфигурации",
    text: "Собираем нужный финиш, исполнение, количество и зависимые позиции.",
  },
  {
    title: "3. Поставка и запуск",
    text: "Переводим товарную карточку в коммерческий запрос, сервис и ввод в работу.",
  },
];

const ProductReaLabPage = ({ productId }: { productId: number }) => {
  const router = useRouter();
  const pathname = usePathname();
  const hasAccessToken = Boolean(getStoredAccessToken());

  const { data } = useGetClothesByIdQuery(productId);
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !hasAccessToken,
  });
  const [addToBasketMutation] = useAddToBasketMutation();
  const [updateBasketMutation] = useUpdateBasketMutation();

  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCart = Array.isArray(cartData) ? cartData[0] : cartData;

  const availableSizes = useMemo(() => {
    const raw = data?.size;
    const source = Array.isArray(raw) ? raw : String(raw || "").split(",");
    return source.map((item) => String(item).trim()).filter(Boolean);
  }, [data?.size]);

  useEffect(() => {
    if (!data?.clothes_img?.length) {
      return;
    }

    const firstImage = data.clothes_img[0];
    setSelectedPhoto(firstImage.photo);
    setSelectedColorId(firstImage.id ?? null);
  }, [data?.clothes_img]);

  useEffect(() => {
    if (!availableSizes.length) {
      return;
    }

    setSelectedSize((current) => current || availableSizes[0]);
  }, [availableSizes]);

  if (!data) {
    return (
      <section className={scss.page}>
        <div className="container">
          <div className={scss.loadingCard}>Загружаем карточку оборудования...</div>
        </div>
      </section>
    );
  }

  const currentPrice = Number(data.discount_price || data.price || 0);
  const basePrice = Number(data.price || 0);
  const isDiscounted = currentPrice > 0 && currentPrice < basePrice;
  const isInStock = Number(data.quantities || 0) > 0;
  const isLowStock = isInStock && Number(data.quantities || 0) <= 3;
  const availabilityLabel = isInStock
    ? `В наличии: ${data.quantities} шт.`
    : "Под заказ или временно недоступно";

  const categoryNames = data.category
    .map((item) => pickCleanText(item.category_name, "Категория"))
    .filter(Boolean);
  const primaryCategory = categoryNames[0] || "Каталог";
  const categoryHref = `/catalog?category=${encodeURIComponent(primaryCategory)}`;
  const promoLabels = data.promo_category
    .map((item) => pickCleanText(item.promo_category, ""))
    .filter(Boolean)
    .slice(0, 3);
  const selectedColorLabel =
    data.clothes_img.find((item) => item.id === selectedColorId)?.color || "";
  const supportHref = `/contacts?topic=procurement&product=${data.id}`;
  const description = pickCleanText(
    data.clothes_description,
    "Поставка медицинского оборудования с возможностью уточнить конфигурацию, сроки и сервисный сценарий через команду ReaLab.",
  );
  const origin = pickCleanText(data.made_in, "ReaLab Supply Network");
  const technologies = data.textile_clothes.length
    ? data.textile_clothes
        .map((item) => pickCleanText(item.textile_name, ""))
        .filter(Boolean)
        .join(", ")
    : "Комплектация уточняется";

  const handleAddToCart = async () => {
    if (!selectedColorId || !selectedSize || isSubmitting) {
      return;
    }

    if (!hasAccessToken) {
      const safePath = pathname && pathname.startsWith("/") ? pathname : `/${productId}`;
      router.push(buildSignInHref(safePath, safePath));
      return;
    }

    setIsSubmitting(true);

    try {
      const cartItems: Array<AllCart["cart_items"][number]> = normalizedCart?.cart_items || [];
      const sameItem = cartItems.find(
        (item) =>
          item.clothes_id === data.id &&
          item.color_id === selectedColorId &&
          item.size === selectedSize,
      );

      if (sameItem) {
        await updateBasketMutation({
          id: sameItem.id,
          updateBasket: {
            quantity: sameItem.quantity + quantity,
          },
        }).unwrap();
      } else {
        await addToBasketMutation({
          clothes_id: data.id,
          color_id: selectedColorId,
          size: selectedSize,
          quantity,
          clothes: {
            clothes_name: data.clothes_name,
          },
          color: {
            color: selectedColorLabel || "",
          },
        }).unwrap();
      }

      router.push("/cart");
    } catch (error) {
      console.error("Add to cart failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={scss.page}>
      <div className="container">
        <nav className={scss.breadcrumbs} aria-label="Хлебные крошки">
          <Link href="/">Главная</Link>
          <span>/</span>
          <Link href="/catalog">Каталог</Link>
          <span>/</span>
          <Link href={categoryHref}>{primaryCategory}</Link>
          <span>/</span>
          <span aria-current="page">{data.clothes_name}</span>
        </nav>

        <div className={scss.productShell}>
          <div className={scss.mediaColumn}>
            <div className={scss.mainMedia}>
              {selectedPhoto ? (
                <Image
                  src={resolveMediaUrl(selectedPhoto)}
                  alt={data.clothes_name}
                  width={960}
                  height={720}
                  priority
                  sizes="(max-width: 1100px) 100vw, 52vw"
                />
              ) : (
                <div className={scss.placeholder} />
              )}
            </div>

            <div className={scss.thumbs}>
              {data.clothes_img.map((item, index) => {
                const isSelected = item.photo === selectedPhoto;
                return (
                  <button
                    key={item.id ?? `${item.photo}-${index}`}
                    type="button"
                    className={`${scss.thumb} ${isSelected ? scss.activeThumb : ""}`}
                    onClick={() => {
                      setSelectedPhoto(item.photo);
                      setSelectedColorId(item.id ?? null);
                    }}
                    aria-label={`Выбрать изображение ${index + 1}`}
                  >
                    <Image
                      src={resolveMediaUrl(item.photo)}
                      alt={`${data.clothes_name} ${index + 1}`}
                      width={240}
                      height={180}
                      sizes="(max-width: 1100px) 20vw, 8vw"
                    />
                  </button>
                );
              })}
            </div>

            <div className={scss.benefits}>
              {benefits.map((item) => (
                <article key={item.title} className={scss.benefitCard}>
                  <div className={scss.benefitIcon}>{item.icon}</div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className={scss.infoColumn}>
            <div className={scss.infoCard}>
              <div className={scss.headerMeta}>
                <span>{categoryNames.join(", ")}</span>
                <span>Рейтинг {Number(data.average_rating || 0).toFixed(1)}</span>
              </div>

              <h1>{data.clothes_name}</h1>

              <div className={scss.badges}>
                {promoLabels.map((item) => (
                  <span key={item} className={scss.badge}>
                    {item}
                  </span>
                ))}
              </div>

              <p className={scss.description}>{description}</p>

              <div className={scss.priceBlock}>
                <div>
                  {isDiscounted ? <del>{formatPrice(basePrice)}</del> : null}
                  <strong>{formatPrice(currentPrice)}</strong>
                </div>
                <div className={scss.availabilityBlock}>
                  <span className={isInStock ? scss.inStock : scss.outOfStock}>
                    {availabilityLabel}
                  </span>
                  {isLowStock ? <small>Осталось несколько единиц</small> : null}
                </div>
              </div>

              <div className={scss.specGrid}>
                <article className={scss.specCard}>
                  <span>Категория</span>
                  <strong>{primaryCategory}</strong>
                </article>
                <article className={scss.specCard}>
                  <span>Происхождение</span>
                  <strong>{origin}</strong>
                </article>
                <article className={scss.specCard}>
                  <span>Технологии</span>
                  <strong>{technologies}</strong>
                </article>
              </div>
            </div>

            <div className={scss.infoCard}>
              <div className={scss.sectionRow}>
                <h2>Финиш корпуса</h2>
                <small>{selectedColorLabel || "Выберите вариант"}</small>
              </div>
              <ColorsClothes
                clothesImg={data.clothes_img}
                onClick={(item) => {
                  setSelectedPhoto(item.photo);
                  setSelectedColorId(item.id ?? null);
                }}
              />

              <div className={scss.sectionRow}>
                <h2>Конфигурация</h2>
                <small>{selectedSize || "Выберите конфигурацию"}</small>
              </div>
              <div className={scss.sizeGrid}>
                {availableSizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={selectedSize === item ? scss.activeSize : ""}
                    onClick={() => setSelectedSize(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className={scss.quantityRow}>
                <div>
                  <h2>Количество</h2>
                  <small>Настройте объем для корзины или коммерческого запроса.</small>
                </div>
                <div className={scss.quantityControl}>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    aria-label="Уменьшить количество"
                  >
                    <FiMinus />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((prev) =>
                        Math.min(isInStock ? Number(data.quantities) : prev + 1, prev + 1),
                      )
                    }
                    aria-label="Увеличить количество"
                    disabled={isInStock ? quantity >= Number(data.quantities) : false}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              <div className={scss.ctaRow}>
                <button
                  type="button"
                  className={scss.primaryCta}
                  onClick={() => void handleAddToCart()}
                  disabled={!isInStock || !selectedColorId || !selectedSize || isSubmitting}
                >
                  {isSubmitting ? "Добавляем..." : "В корзину"}
                </button>
                <Link href={supportHref} className={scss.secondaryCta}>
                  Обсудить поставку <FiArrowRight />
                </Link>
              </div>

              <div className={scss.notes}>
                <div>
                  <FiCheckCircle />
                  <span>Подходит для быстрого перехода к запросу КП и согласованию закупки.</span>
                </div>
                <div>
                  <FiCheckCircle />
                  <span>Конфигурация, доступность и сервисный слой видны прямо в карточке.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className={scss.supportBand}>
          <article className={scss.supportCard}>
            <span className={scss.supportEyebrow}>Service Layer</span>
            <h2>Нужна не корзина, а оснащение под сценарий?</h2>
            <p>
              Свяжитесь с командой ReaLab, если продукт идет в тендер, переоснащение
              отделения или проект с несколькими конфигурациями и зависимыми позициями.
            </p>
            <Link href={supportHref}>Перейти к контакту</Link>
          </article>
        </section>

        <section className={scss.workflowBand}>
          <div className={scss.workflowGrid}>
            {workflowSteps.map((item) => (
              <article key={item.title} className={scss.workflowCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <ProductRecommendations
          currentProductId={data.id}
          currentPromoCategory={data.promo_category}
          currentColors={data.clothes_img.map((item) => item.color)}
        />
      </div>
    </section>
  );
};

export default ProductReaLabPage;
