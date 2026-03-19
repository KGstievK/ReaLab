"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, usePathname, useRouter } from "next/navigation";
import star from "@/assets/images/star.png";
import bagSvg from "@/assets/icons/bag-happy.svg";
import scss from "./SinglePageSection.module.scss";
import {
  useAddToBasketMutation,
  useGetCartQuery,
  useUpdateBasketMutation,
} from "../../../../../redux/api/product";
import { useGetClothesByIdQuery } from "../../../../../redux/api/category";
import { getStoredAccessToken } from "../../../../../utils/authStorage";
import { buildSignInHref } from "../../../../../utils/authIntent";
import ColorsClothes from "../../ui/colors/Colors";
import Sizes from "./sizes/Sizes";
import { resolveMediaUrl } from "@/utils/media";

const SinglePageRecommendations = dynamic(
  () => import("./recommendations/SinglePageRecommendations"),
  {
    loading: () => (
      <div className={scss.deferredState}>
        <p>Подбираем похожие решения...</p>
      </div>
    ),
  },
);

const Review = dynamic(() => import("./Review/Review"), {
  loading: () => (
    <div className={scss.deferredState}>
      <p>Загружаем отзывы клиентов...</p>
    </div>
  ),
});

const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const formatPrice = (value: number) => `${value.toLocaleString("ru-RU")} KGS`;

interface ClothesImg {
  photo: string;
  id?: number | null;
  color: string;
}

interface CartItem {
  id: number;
  clothes_id: number;
  size: string;
  color: number;
  quantity: number;
}

interface CartData {
  cart_items: CartItem[];
}

interface FormValues {
  color_id: number;
  size: string;
}

const trustItems = [
  {
    title: "Поставка и ввод в работу",
    text: "Согласуем логистику, документы и сценарий запуска оборудования под вашу организацию.",
  },
  {
    title: "Клинический и инженерный контекст",
    text: "Решения ReaLab подбираются с учетом отделения, потока пациентов и требований к сервису.",
  },
  {
    title: "Поддержка после поставки",
    text: "Помогаем с сервисным маршрутом, дооснащением и повторными закупками после внедрения.",
  },
];

const sizeGuideRows = [
  { size: "XXS", channels: "4", display: "7\"", usage: "Транспорт и палата" },
  { size: "XS", channels: "5", display: "8\"", usage: "Смотровой кабинет" },
  { size: "S", channels: "6", display: "10\"", usage: "Общий стационар" },
  { size: "M", channels: "8", display: "12\"", usage: "Операционный блок" },
  { size: "L", channels: "10", display: "15\"", usage: "ICU / реанимация" },
  { size: "XL", channels: "12", display: "17\"", usage: "Высокая нагрузка" },
  { size: "XXL", channels: "Модуль", display: "19\"", usage: "Центральная станция" },
] as const;

const fitNotes = [
  "Базовые конфигурации подходят для стандартных кабинетов и палатных сценариев.",
  "Если оборудование планируется для интенсивной терапии, ориентируйтесь на конфигурации с запасом по каналам и экрану.",
  "Перед закупкой уточняйте итоговую спецификацию, совместимость и сервисный маршрут у команды ReaLab.",
];

const deliveryNotes = [
  "Стоимость и срок поставки рассчитываются автоматически на этапе оформления запроса.",
  "Для крупных проектов команда ReaLab подтверждает график отгрузки и пакет документов отдельно.",
  "При необходимости поможем с вводом в эксплуатацию, сервисным маршрутом и дооснащением.",
] as const;

const SinglePageSection: FC = () => {
  const params = useParams<{ single: string }>();
  const productId = Number(params.single);
  const { data: cart } = useGetCartQuery();
  const { data } = useGetClothesByIdQuery(productId);
  const [selectedPhoto, setSelectedPhoto] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [count, setCounter] = useState(1);
  const [expandedPanel, setExpandedPanel] = useState<"size" | "fit" | "delivery" | null>(
    null,
  );
  const [addBasketMutation] = useAddToBasketMutation();
  const [updateBasketMutation] = useUpdateBasketMutation();
  const router = useRouter();
  const pathname = usePathname();

  const normalizedCart: CartData | undefined = Array.isArray(cart)
    ? cart[0]
    : (cart as CartData | undefined);

  const {
    handleSubmit,
    formState: { errors },
    setValue: setFormValue,
    register,
  } = useForm<FormValues>({
    defaultValues: {
      color_id: 0,
      size: "",
    },
  });

  useEffect(() => {
    if (data?.clothes_img?.length) {
      const firstPhoto = data.clothes_img[0];
      setSelectedPhoto(firstPhoto.photo);
      setFormValue("color_id", firstPhoto.id, { shouldValidate: true });
    }
  }, [data, setFormValue]);

  if (!data) {
    return <div>Загрузка данных...</div>;
  }

  const incrementCount = () => {
    setCounter((prevCount) =>
      prevCount < data.quantities ? prevCount + 1 : prevCount,
    );
  };

  const decrementCount = () => {
    setCounter((prevCount) => (prevCount > 1 ? prevCount - 1 : prevCount));
  };

  const onSubmit = async (formData: FormValues) => {
    if (!formData.color_id || !formData.size) {
      return;
    }

    if (!getStoredAccessToken()) {
      const safePath =
        pathname && pathname.startsWith("/") ? pathname : `/${params.single}`;
      router.push(buildSignInHref(safePath, safePath));
      return;
    }

    try {
      const cartItems = normalizedCart?.cart_items || [];
      const sameItem = cartItems.find(
        (item) =>
          item.clothes_id === data.id &&
          item.color === formData.color_id &&
          item.size === formData.size,
      );

      if (sameItem) {
        await updateBasketMutation({
          id: sameItem.id,
          updateBasket: {
            quantity: sameItem.quantity + count,
          },
        }).unwrap();
      } else {
        await addBasketMutation({
          clothes_id: data.id,
          color_id: formData.color_id,
          size: formData.size,
          quantity: count,
          clothes: {
            clothes_name: "",
          },
          color: {
            color: "",
          },
        }).unwrap();
      }

      router.push("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const {
    clothes_name,
    category,
    clothes_description,
    price,
    discount_price,
    size: availableSizes,
    textile_clothes,
    clothes_img,
    average_rating,
    id,
  } = data;

  const categoryNames = category.map((item) => item.category_name).filter(Boolean);
  const primaryCategory = categoryNames[0] || "Оборудование";
  const categoryHref = `/catalog?category=${encodeURIComponent(primaryCategory)}`;

  const normalizedAvailableSizes = (
    Array.isArray(availableSizes)
      ? availableSizes
      : (availableSizes?.split(",") ?? [])
  )
    .map((item: string) => item.trim().toUpperCase())
    .filter(Boolean);

  const currentPrice = Math.round(Number(discount_price ?? price));
  const previousPrice = Math.round(Number(price));
  const ratingValue = Number(average_rating || 0).toFixed(2);
  const isInStock = data.quantities > 0;
  const isLowStock = isInStock && data.quantities <= 3;
  const availabilityLabel = isInStock
    ? `Доступно на складе: ${data.quantities} ед.`
    : "Нет в наличии";
  const restockHref = `/contacts?topic=restock&product=${id}`;
  const submitSelection = handleSubmit(onSubmit);

  const handleSelectPhoto = (item: ClothesImg) => {
    if (!item.id) {
      return;
    }

    setFormValue("color_id", item.id, { shouldValidate: true });
    setSelectedPhoto(item.photo);
  };

  return (
    <section className={scss.SinglePageSection}>
      <div className="container">
        <nav className={scss.header} aria-label="Хлебные крошки">
          <Link href="/">Главная</Link>
          <span aria-hidden="true">|</span>
          <Link href="/catalog">Каталог</Link>
          <span aria-hidden="true">|</span>
          <Link href={categoryHref}>{primaryCategory}</Link>
          <span aria-hidden="true">|</span>
          <span aria-current="page">{clothes_name}</span>
        </nav>

        <div className={scss.content}>
          <div className={scss.images}>
            <div className={scss.mainImg}>
              <Image
                src={resolveMediaUrl(selectedPhoto) || "/fallback-image.png"}
                alt={clothes_name}
                width={6000}
                height={5000}
                priority
                sizes="(max-width: 1100px) 100vw, 52vw"
              />
            </div>

            <div className={scss.thumbnails} aria-label="Миниатюры оборудования">
              {clothes_img?.map((item, index) => {
                const isSelected = item.photo === selectedPhoto;
                const colorLabel = item.color ? `Исполнение ${item.color}` : `Фото ${index + 1}`;

                return (
                  <button
                    key={item.id ?? `${item.photo}-${index}`}
                    type="button"
                    className={`${scss.thumbnail} ${isSelected ? scss.activeThumbnail : ""}`}
                    onClick={() => handleSelectPhoto(item)}
                    aria-label={`Выбрать изображение: ${colorLabel}`}
                    aria-pressed={isSelected}
                  >
                    <Image
                      src={resolveMediaUrl(item.photo)}
                      alt={`${clothes_name}, ${colorLabel}`}
                      width={2500}
                      height={2500}
                      sizes="(max-width: 1100px) 18vw, 8vw"
                    />
                  </button>
                );
              })}
            </div>
             <div className={scss.trustGrid1}>
              {trustItems.map((item) => (
                <article key={item.title} className={scss.trustItem}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={scss.info}>
            <input
              type="hidden"
              {...register("color_id", { required: true, valueAsNumber: true })}
            />
            <input type="hidden" {...register("size", { required: true })} />

            <div className={scss.headLine}>
              <h3>{categoryNames.join(", ")}</h3>
              <div className={scss.mark}>
                <Image src={star} alt="Рейтинг" width={24} height={24} />
                <h6>{ratingValue}</h6>
              </div>
            </div>

            <h1>{clothes_name}</h1>

            <div className={scss.statusRow}>
              <div className={scss.availabilityGroup}>
                <span
                  className={`${scss.availability} ${
                    isInStock ? scss.inStock : scss.outOfStock
                  }`}
                >
                  {availabilityLabel}
                </span>
                {isLowStock ? (
                  <span className={scss.availabilityHint}>Осталось совсем немного</span>
                ) : null}
              </div>
              <span className={scss.metaItem}>Артикул: RL-{id}</span>
            </div>

            <div className={scss.price}>
              {previousPrice !== currentPrice ? <del>{formatPrice(previousPrice)}</del> : null}
              <h4>{formatPrice(currentPrice)}</h4>
            </div>

            <div className={scss.textile}>
              <h5>Материалы и платформа:</h5>
              <h4>
                {textile_clothes
                  .map((item: { textile_name: string }) =>
                    capitalize(item.textile_name),
                  )
                  .join(", ")}
              </h4>
            </div>

            <div className={scss.colors}>
              <h5>Исполнения:</h5>
              <ColorsClothes
                clothesImg={clothes_img}
                onClick={(item) => {
                  if (!item.id) {
                    return;
                  }

                  handleSelectPhoto(item);
                }}
              />
              {errors.color_id && (
                <p className={scss.error} role="alert">
                  Пожалуйста, выберите исполнение
                </p>
              )}
            </div>
            <div className={scss.description}>
              <p>{clothes_description}</p>
            </div>

            <div className={scss.metaList}>
              <div className={scss.metaCard}>
                <span>Поставщик</span>
                <strong>{data.made_in || "ReaLab Certified"}</strong>
              </div>
              <div className={scss.metaCard}>
                <span>Категория оборудования</span>
                <strong>{primaryCategory}</strong>
              </div>
              <div className={scss.metaCard}>
                <span>Сценарий</span>
                <strong>Клиники, лаборатории и ICU</strong>
              </div>
            </div>

            <div className={scss.sizes}>
              <Sizes
                sizes={sizes}
                availableSizes={normalizedAvailableSizes}
                selectedSize={selectedSize}
                onClick={(size) => {
                  setFormValue("size", size, { shouldValidate: true });
                  setSelectedSize(size);
                }}
              />
              {errors.size && (
                <p className={scss.error} role="alert">
                  Пожалуйста, выберите конфигурацию
                </p>
              )}
            </div>

            {isInStock ? (
              <div className={scss.quantity}>
                <h3>Количество единиц:</h3>
                <div className={scss.groupOfBtn}>
                  <div className={scss.counter}>
                    <button
                      type="button"
                      onClick={decrementCount}
                      disabled={count === 1}
                      aria-label="Уменьшить количество"
                    >
                      -
                    </button>
                    <span aria-live="polite">{count}</span>
                    <button
                      type="button"
                      onClick={incrementCount}
                      disabled={count >= data.quantities}
                      className={count >= data.quantities ? scss.disabledBtn : ""}
                      aria-label="Увеличить количество"
                    >
                      +
                    </button>
                  </div>

                  <button type="submit" className={scss.cart}>
                    Добавить в запрос
                    <Image src={bagSvg} alt="Корзина" width={20} height={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className={scss.restockCard}>
                <div>
                  <h3>Позиция временно недоступна</h3>
                  <p>
                    Напишите нам, и мы подскажем сроки поставки или предложим
                    близкую по сценарию систему.
                  </p>
                </div>
                <Link href={restockHref} className={scss.restockLink}>
                  Сообщить о поступлении
                </Link>
              </div>
            )}

            <div className={scss.infoAccordions}>
              <article className={scss.infoAccordion}>
                <button
                  type="button"
                  className={scss.infoAccordionTrigger}
                  aria-expanded={expandedPanel === "size"}
                  aria-controls="pdp-size-guide"
                  onClick={() =>
                    setExpandedPanel((prev) => (prev === "size" ? null : "size"))
                  }
                >
                  <span>Таблица конфигураций</span>
                  <span aria-hidden="true">{expandedPanel === "size" ? "−" : "+"}</span>
                </button>
                {expandedPanel === "size" ? (
                  <div id="pdp-size-guide" className={scss.infoAccordionBody}>
                    <p>
                      Матрица ниже показывает условные конфигурации каталога. Перед
                      закупкой сверяйте итоговую спецификацию, комплектацию и
                      совместимость с менеджером ReaLab.
                    </p>
                    <div className={scss.sizeGuideTable}>
                      <div className={scss.sizeGuideHead}>
                        <span>Конфиг</span>
                        <span>Каналы</span>
                        <span>Экран</span>
                        <span>Сценарий</span>
                      </div>
                      {sizeGuideRows.map((row) => (
                        <div key={row.size} className={scss.sizeGuideRow}>
                          <strong>{row.size}</strong>
                          <span>{row.channels}</span>
                          <span>{row.display}</span>
                          <span>{row.usage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>

              <article className={scss.infoAccordion}>
                <button
                  type="button"
                  className={scss.infoAccordionTrigger}
                  aria-expanded={expandedPanel === "fit"}
                  aria-controls="pdp-fit-guide"
                  onClick={() => setExpandedPanel((prev) => (prev === "fit" ? null : "fit"))}
                >
                  <span>Комплектация и рекомендации</span>
                  <span aria-hidden="true">{expandedPanel === "fit" ? "−" : "+"}</span>
                </button>
                {expandedPanel === "fit" ? (
                  <div id="pdp-fit-guide" className={scss.infoAccordionBody}>
                    <ul className={scss.infoList}>
                      {fitNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>

              <article className={scss.infoAccordion}>
                <button
                  type="button"
                  className={scss.infoAccordionTrigger}
                  aria-expanded={expandedPanel === "delivery"}
                  aria-controls="pdp-delivery-info"
                  onClick={() =>
                    setExpandedPanel((prev) => (prev === "delivery" ? null : "delivery"))
                  }
                >
                  <span>Поставка и сервис</span>
                  <span aria-hidden="true">{expandedPanel === "delivery" ? "−" : "+"}</span>
                </button>
                {expandedPanel === "delivery" ? (
                  <div id="pdp-delivery-info" className={scss.infoAccordionBody}>
                    <ul className={scss.infoList}>
                      {deliveryNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            </div>

          </form>
          <div className={scss.trustGrid2}>
              {trustItems.map((item) => (
                <article key={item.title} className={scss.trustItem}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
        </div>

        <div className={scss.recommendations}>
          <SinglePageRecommendations
            currentProductId={data.id}
            currentPromoCategory={data.promo_category}
            currentColors={data.clothes_img.map((item) => item.color)}
          />
        </div>

        <div className={scss.review}>
          <Review />
        </div>
      </div>

      <div className={scss.stickyBar}>
        <div className="container">
          <div className={scss.stickyInner}>
            <div className={scss.stickySummary}>
              <p>{clothes_name}</p>
              <div className={scss.stickyPrice}>
                {previousPrice !== currentPrice ? (
                  <del>{formatPrice(previousPrice)}</del>
                ) : null}
                <strong>{formatPrice(currentPrice)}</strong>
              </div>
              <span>{selectedSize ? `Конфигурация: ${selectedSize}` : "Выберите конфигурацию"}</span>
            </div>

            <button
              type="button"
              className={scss.stickyButton}
              onClick={isInStock ? submitSelection : () => router.push(restockHref)}
              aria-label={isInStock ? "Добавить позицию в запрос" : "Перейти к заявке на поступление"}
            >
              {isInStock ? "Добавить в запрос" : "Сообщить о поступлении"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SinglePageSection;
