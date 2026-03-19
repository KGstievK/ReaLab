"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaBoxOpen } from "react-icons/fa6";
import star from "@/assets/images/star.png";
import heartRed from "@/assets/icons/red-heart-icon.svg";
import bagIcon from "@/assets/icons/bag-happyBlack.svg";
import {
  useDeleteFavoriteMutation,
  useGetToFavoriteQuery,
} from "../../../../../redux/api/category";
import scss from "./FavoritSection.module.scss";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";

interface FavoriteItem {
  id: number;
  clothes: {
    id: number;
    clothes_name: string;
    price: number | string;
    discount_price: number | string;
    average_rating: number | string;
    clothes_img: Array<{
      id?: number;
      photo: string;
      color: string;
    }>;
  };
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: string | number) =>
  `${toNumber(value).toLocaleString("ru-RU")} KGS`;

const getColor = (rawColor: string) => {
  const color = rawColor.trim().toLowerCase();
  const map: Record<string, string> = {
    серый: "#8d8d8d",
    коричневый: "#7a5735",
    синий: "#3d5d9a",
    зеленый: "#4f7446",
    зелёный: "#4f7446",
    красный: "#b23941",
    желтый: "#f3cf4e",
    жёлтый: "#f3cf4e",
    оранжевый: "#f09b34",
    черный: "#111111",
    чёрный: "#111111",
    белый: "#ffffff",
    фиолетовый: "#7b4aa6",
    розовый: "#d588a6",
    голубой: "#86b6d6",
    бирюзовый: "#2f9fa2",
    бежевый: "#d8c6a4",
    золотой: "#b89742",
    серебряный: "#c7c7c7",
    бордовый: "#6a1f2f",
    ivory: "#f2eee6",
    айвори: "#f2eee6",
    gray: "#8d8d8d",
    brown: "#7a5735",
    blue: "#3d5d9a",
    green: "#4f7446",
    red: "#b23941",
    yellow: "#f3cf4e",
    orange: "#f09b34",
    black: "#111111",
    white: "#ffffff",
    purple: "#7b4aa6",
    pink: "#d588a6",
    lightblue: "#86b6d6",
    turquoise: "#2f9fa2",
    beige: "#d8c6a4",
    gold: "#b89742",
    silver: "#c7c7c7",
    maroon: "#6a1f2f",
  };

  return map[color] || "#9d9d9d";
};

const Favorite = () => {
  const router = useRouter();
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetToFavoriteQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteFavorite, { isLoading: isDeletingFavorite }] = useDeleteFavoriteMutation();

  const favorites: FavoriteItem[] = Array.isArray(data)
    ? (data as FavoriteItem[])
    : [];

  const handleDeleteFavorite = async (
    event: React.MouseEvent<HTMLButtonElement>,
    favoriteId: number,
  ) => {
    event.stopPropagation();

    try {
      setFavoriteMessage(null);
      await deleteFavorite(favoriteId).unwrap();
    } catch (mutationError) {
      const apiError = extractApiErrorInfo(
        mutationError,
        "Не удалось удалить товар из избранного",
      );
      setFavoriteMessage(
        getRateLimitAwareMessage(
          apiError,
          "Не удалось удалить товар из избранного. Попробуйте позже.",
        ),
      );
    }
  };

  const renderCard = (item: FavoriteItem) => {
    const image = resolveMediaUrl(item.clothes.clothes_img[0]?.photo) || "/fallback-image.png";
    const colors = item.clothes.clothes_img.slice(0, 3);
    const price = formatPrice(item.clothes.discount_price);
    const oldPrice =
      toNumber(item.clothes.price) > 0 ? formatPrice(item.clothes.price) : "";
    const rating = toNumber(item.clothes.average_rating) || 4.95;
    const productHref = buildProductHref(item.clothes);

    return (
      <article key={item.id} className={scss.card}>
        <div className={scss.imageWrap}>
          <div className={scss.cardTop}>
            <div className={scss.rating}>
              <Image src={star} alt="rating" width={14} height={14} />
              <span>{rating}</span>
            </div>

            <button
              type="button"
              className={scss.favoriteButton}
              onClick={(event) => void handleDeleteFavorite(event, item.id)}
              aria-label="Удалить из избранного"
              disabled={isDeletingFavorite}
            >
              <Image src={heartRed} alt="favorite" width={24} height={24} />
            </button>
          </div>

          <Link href={productHref} className={scss.imageLink}>
            <Image
              src={image}
              alt={item.clothes.clothes_name}
              width={450}
              height={560}
              className={scss.mainImage}
            />
          </Link>

          <button
            type="button"
            className={scss.cartButton}
            onClick={() => router.push(productHref)}
            aria-label="Открыть позицию"
          >
            <Image src={bagIcon} alt="cart" width={18} height={18} />
          </button>
        </div>

        <div className={scss.cardInfo}>
          <p className={scss.category}>Избранное</p>
          <h3>
            <Link href={productHref}>{item.clothes.clothes_name}</Link>
          </h3>

          <div className={scss.colorRow}>
            {colors.map((colorItem, index) => (
              <span
                key={`${item.id}-color-${index}`}
                className={scss.colorDot}
                style={{ backgroundColor: getColor(colorItem.color) }}
                title={colorItem.color}
              />
            ))}
          </div>

          <div className={scss.priceRow}>
            <span>{price}</span>
            {oldPrice && <del>{oldPrice}</del>}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className={scss.FavoritSection}>
      <h2>Избранные</h2>
      <p>Сохраняйте интересующие позиции и возвращайтесь к ним при подготовке закупки.</p>

      {favoriteMessage ? (
        <div className={`${scss.statusState} ${scss.statusStateError}`} role="alert">
          <p>{favoriteMessage}</p>
          <button type="button" onClick={() => void refetch()}>
            Повторить
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className={scss.statusState}>
          <p>Загружаем избранные товары...</p>
        </div>
      ) : isError ? (
        <div className={`${scss.statusState} ${scss.statusStateError}`} role="alert">
          <p>
            {getRateLimitAwareMessage(
              extractApiErrorInfo(error, "Не удалось загрузить избранное"),
              "Не удалось загрузить избранные товары. Попробуйте позже.",
            )}
          </p>
          <button type="button" onClick={() => void refetch()}>
            Повторить
          </button>
        </div>
      ) : favorites.length === 0 ? (
        <div className={scss.emptyState}>
          <FaBoxOpen className={scss.emptyIcon} />
          <p>Список сохраненных позиций пока пуст.</p>
          <button type="button" className={scss.emptyAction} onClick={() => router.push("/catalog")}>
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className={scss.grid}>{favorites.map(renderCard)}</div>
      )}
    </section>
  );
};

export default Favorite;
