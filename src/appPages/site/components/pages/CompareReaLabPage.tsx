"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FiArrowRight, FiCheckCircle, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { useGetClothesByIdQuery } from "@/redux/api/category";
import {
  useAddToBasketMutation,
  useGetCartQuery,
  useUpdateBasketMutation,
} from "@/redux/api/product";
import { getStoredAccessToken } from "@/utils/authStorage";
import { CompareEquipmentItem } from "@/utils/compareStorage";
import { writeGuestRequestItems } from "@/utils/requestDraftStorage";
import { resolveMediaUrl } from "@/utils/media";
import { useEquipmentCompare } from "@/utils/useEquipmentCompare";
import scss from "./CompareReaLabPage.module.scss";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} KGS`;

const parseSizes = (value: unknown) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source.map((item) => String(item).trim()).filter(Boolean);
};

const buildGuestDraftItems = (items: CompareEquipmentItem[]) =>
  items.map((item) => ({
    product_id: item.id,
    quantity: 1,
    configuration_label: item.defaultSize,
    color_label: item.defaultColorLabel,
    product_name: item.name,
    image_url: item.imageUrl,
    catalog_price: item.discountPrice > 0 ? item.discountPrice : item.price,
  }));

const CompareEquipmentPanel = ({
  item,
  onRemove,
}: {
  item: CompareEquipmentItem;
  onRemove: (id: number) => void;
}) => {
  const { data, isFetching } = useGetClothesByIdQuery(item.id);

  const sizes = parseSizes(data?.size || item.defaultSize);
  const image =
    resolveMediaUrl(data?.clothes_img?.[0]?.photo || item.imageUrl) || "/fallback-image.png";
  const effectivePrice = toNumber(data?.discount_price || item.discountPrice || data?.price || item.price);
  const basePrice = toNumber(data?.price || item.price);
  const isDiscounted = effectivePrice > 0 && basePrice > effectivePrice;
  const technologies = data?.textile_clothes?.length
    ? data.textile_clothes.map((entry) => entry.textile_name).filter(Boolean).join(", ")
    : "Комплектация уточняется";
  const rating = toNumber(data?.average_rating);
  const stockQuantity = toNumber((data as SingleProductData & { quantities?: number | string })?.quantities);
  const availabilityLabel = stockQuantity > 0 ? `В наличии ${stockQuantity} шт.` : item.availabilityLabel;
  const categoryName = data?.category?.[0]?.category_name || item.categoryName;
  const origin = data?.made_in || "ReaLab Supply Network";
  const description =
    data?.clothes_description ||
    "Подходит для включения в RFQ, проектную поставку и сравнение конфигураций на этапе закупки.";

  const metrics = [
    { label: "Категория", value: categoryName || "Каталог" },
    { label: "Конфигурации", value: sizes.join(" / ") || item.defaultSize || "Base" },
    { label: "Финиш по умолчанию", value: item.defaultColorLabel || "Стандартный финиш" },
    { label: "Доступность", value: availabilityLabel },
    { label: "Происхождение", value: origin },
    { label: "Технологии", value: technologies },
    { label: "Рейтинг", value: rating > 0 ? rating.toFixed(1) : "Новый артикул" },
  ];

  return (
    <article className={scss.compareCard}>
      <div className={scss.cardVisual}>
        <button
          type="button"
          className={scss.removeButton}
          onClick={() => onRemove(item.id)}
          aria-label="Удалить позицию из сравнения"
        >
          <FiTrash2 />
        </button>

        <Image
          src={image}
          alt={item.name}
          width={640}
          height={420}
          className={scss.mainImage}
        />
      </div>

      <div className={scss.cardBody}>
        <div className={scss.cardHeader}>
          <span>{categoryName || "Каталог"}</span>
          <Link href={item.href}>Открыть карточку</Link>
        </div>

        <h2>{item.name}</h2>

        <div className={scss.priceRow}>
          <strong>{formatPrice(effectivePrice)}</strong>
          {isDiscounted ? <small>{formatPrice(basePrice)}</small> : null}
        </div>

        <div className={scss.metricList}>
          {metrics.map((metric) => (
            <div key={metric.label} className={scss.metricCard}>
              <span>{metric.label}</span>
              <strong>{isFetching ? "Уточняем..." : metric.value}</strong>
            </div>
          ))}
        </div>

        <div className={scss.descriptionBlock}>
          <span>Краткое назначение</span>
          <p>{description}</p>
        </div>
      </div>
    </article>
  );
};

const CompareReaLabPage = () => {
  const router = useRouter();
  const hasAccessToken = Boolean(getStoredAccessToken());
  const [message, setMessage] = useState<string | null>(null);
  const { items, count, clearItems, removeItemById } = useEquipmentCompare();
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !hasAccessToken,
  });
  const [addToBasketMutation] = useAddToBasketMutation();
  const [updateBasketMutation] = useUpdateBasketMutation();

  const normalizedCart = Array.isArray(cartData) ? cartData[0] : cartData;

  const catalogEstimate = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + toNumber(item.discountPrice > 0 ? item.discountPrice : item.price),
        0,
      ),
    [items],
  );

  const categoriesCount = useMemo(() => new Set(items.map((item) => item.categoryName)).size, [items]);

  const moveItemsToBasket = async () => {
    const existingCartItems: Array<AllCart["cart_items"][number]> = normalizedCart?.cart_items || [];

    for (const item of items) {
      if (!item.defaultColorId) {
        continue;
      }

      const existing = existingCartItems.find(
        (cartItem) =>
          cartItem.clothes_id === item.id &&
          cartItem.color_id === item.defaultColorId &&
          cartItem.size === item.defaultSize,
      );

      if (existing) {
        await updateBasketMutation({
          id: existing.id,
          updateBasket: {
            quantity: existing.quantity + 1,
          },
        }).unwrap();
        continue;
      }

      await addToBasketMutation({
        clothes_id: item.id,
        color_id: item.defaultColorId,
        size: item.defaultSize,
        quantity: 1,
        clothes: {
          clothes_name: item.name,
        },
        color: {
          color: item.defaultColorLabel,
        },
      }).unwrap();
    }
  };

  const handlePrepareRfq = async () => {
    if (items.length === 0) {
      router.push("/catalog");
      return;
    }

    try {
      if (hasAccessToken) {
        await moveItemsToBasket();
      } else {
        writeGuestRequestItems(buildGuestDraftItems(items));
      }

      setMessage("Сравнение подготовлено для RFQ. Переходим к форме запроса.");
      router.push("/cart/checkout");
    } catch (error) {
      console.error("Compare RFQ preparation failed:", error);
      setMessage("Не удалось подготовить сравнение к RFQ. Попробуйте ещё раз.");
    }
  };

  return (
    <section className={scss.page}>
      <div className="container">
        <div className={scss.hero}>

          <div className={scss.heroMain}>
            <span>Comparison Layer</span>
            <h1>Сравнение оборудования ReaLab</h1>
            <p>
              Сводите ключевые позиции в одну procurement-ready плоскость, чтобы быстрее
              перейти к RFQ, внутреннему согласованию и выбору конфигурации.
            </p>
          </div>

          <div className={scss.heroStats}>
            <article className={scss.heroStat}>
              <span>Позиций</span>
              <strong>{count}</strong>
            </article>
            <article className={scss.heroStat}>
              <span>Категорий</span>
              <strong>{categoriesCount}</strong>
            </article>
            <article className={scss.heroStat}>
              <span>Ориентир</span>
              <strong>{formatPrice(catalogEstimate)}</strong>
            </article>
          </div>
        </div>

        <div className={scss.toolbar}>
          <div className={scss.toolbarCopy}>
            <p>
              {hasAccessToken
                ? "Можно сразу перевести выбранные позиции в request basket и отправить RFQ."
                : "Даже без входа можно отправить RFQ по выбранным позициям через гостевой сценарий."}
            </p>
            {message ? <strong>{message}</strong> : null}
          </div>

          <div className={scss.toolbarActions}>
            <button type="button" className={scss.primaryAction} onClick={() => void handlePrepareRfq()}>
              <FiCheckCircle />
              Подготовить RFQ
            </button>
            <button type="button" className={scss.secondaryAction} onClick={() => router.push("/catalog")}>
              <FiArrowRight />
              В каталог
            </button>
            <button type="button" className={scss.secondaryAction} onClick={() => clearItems()}>
              <FiRefreshCw />
              Очистить
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className={scss.emptyState}>
            <h2>Список сравнения пока пуст</h2>
            <p>
              Добавьте до четырех позиций из каталога, PDP или shortlist, чтобы сравнить
              конфигурации и сразу перейти к RFQ.
            </p>
            <div className={scss.emptyActions}>
              <Link href="/catalog" className={scss.primaryLink}>
                Перейти в каталог
              </Link>
              <Link href="/profile/favorite" className={scss.secondaryLink}>
                Открыть shortlist
              </Link>
            </div>
          </div>
        ) : (
          <div className={scss.compareGrid}>
            {items.map((item) => (
              <CompareEquipmentPanel
                key={item.id}
                item={item}
                onRemove={removeItemById}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CompareReaLabPage;
