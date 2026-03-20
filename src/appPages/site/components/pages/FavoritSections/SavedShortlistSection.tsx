"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FiArrowRight, FiBookmark, FiCheckCircle, FiPlus, FiTrash2 } from "react-icons/fi";
import { useDeleteFavoriteMutation, useGetToFavoriteQuery } from "../../../../../redux/api/category";
import {
  useAddToBasketMutation,
  useGetCartQuery,
  useUpdateBasketMutation,
} from "../../../../../redux/api/product";
import { buildSignInHref } from "@/utils/authIntent";
import { getStoredAccessToken } from "@/utils/authStorage";
import { resolveMediaUrl } from "@/utils/media";
import { buildProductHref } from "@/utils/productRoute";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";
import scss from "./SavedShortlistSection.module.scss";

interface FavoriteItem {
  id: number;
  clothes: {
    id: number;
    clothes_name: string;
    size: string;
    price: number | string;
    discount_price: number | string;
    clothes_img: Array<{
      id?: number;
      photo: string;
      color: string;
    }>;
  };
}

type BatchActionState = "idle" | "adding";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: string | number) =>
  `${toNumber(value).toLocaleString("ru-RU")} KGS`;

const getPrimaryVariant = (item: FavoriteItem) => {
  const primaryImage = item.clothes.clothes_img[0];
  const firstSize =
    item.clothes.size
      ?.split(",")
      .map((value) => value.trim())
      .find(Boolean) || "Base";

  return {
    colorId: primaryImage?.id ?? null,
    colorLabel: primaryImage?.color || "Стандартный финиш",
    size: firstSize,
  };
};

const SavedShortlistSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const hasAccessToken = Boolean(getStoredAccessToken());
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchState, setBatchState] = useState<BatchActionState>("idle");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetToFavoriteQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !hasAccessToken,
  });
  const [deleteFavorite, { isLoading: isDeletingFavorite }] = useDeleteFavoriteMutation();
  const [addToBasketMutation] = useAddToBasketMutation();
  const [updateBasketMutation] = useUpdateBasketMutation();

  const favorites: FavoriteItem[] = Array.isArray(data) ? (data as FavoriteItem[]) : [];
  const normalizedCart = Array.isArray(cartData) ? cartData[0] : cartData;

  const selectedFavorites = useMemo(
    () => favorites.filter((item) => selectedIds.includes(item.id)),
    [favorites, selectedIds],
  );

  const totalShortlistValue = useMemo(
    () =>
      favorites.reduce(
        (sum, item) => sum + toNumber(item.clothes.discount_price || item.clothes.price),
        0,
      ),
    [favorites],
  );

  const selectedShortlistValue = useMemo(
    () =>
      selectedFavorites.reduce(
        (sum, item) => sum + toNumber(item.clothes.discount_price || item.clothes.price),
        0,
      ),
    [selectedFavorites],
  );

  const ensureAuthenticated = () => {
    if (hasAccessToken) {
      return true;
    }

    const safePath = pathname && pathname.startsWith("/") ? pathname : "/profile/favorite";
    router.push(buildSignInHref(safePath, safePath));
    return false;
  };

  const addFavoriteToRequestBasket = async (item: FavoriteItem) => {
    const primaryVariant = getPrimaryVariant(item);
    if (!primaryVariant.colorId) {
      throw new Error("Missing product color");
    }

    const existingCartItems: Array<AllCart["cart_items"][number]> = normalizedCart?.cart_items || [];
    const sameItem = existingCartItems.find(
      (cartItem) =>
        cartItem.clothes_id === item.clothes.id &&
        cartItem.color_id === primaryVariant.colorId &&
        cartItem.size === primaryVariant.size,
    );

    if (sameItem) {
      await updateBasketMutation({
        id: sameItem.id,
        updateBasket: {
          quantity: sameItem.quantity + 1,
        },
      }).unwrap();
      return;
    }

    await addToBasketMutation({
      clothes_id: item.clothes.id,
      color_id: primaryVariant.colorId,
      size: primaryVariant.size,
      quantity: 1,
      clothes: {
        clothes_name: item.clothes.clothes_name,
      },
      color: {
        color: primaryVariant.colorLabel,
      },
    }).unwrap();
  };

  const handleDeleteFavorite = async (
    event: React.MouseEvent<HTMLButtonElement>,
    favoriteId: number,
  ) => {
    event.stopPropagation();

    try {
      setMessage(null);
      await deleteFavorite(favoriteId).unwrap();
      setSelectedIds((prev) => prev.filter((id) => id !== favoriteId));
    } catch (mutationError) {
      const apiError = extractApiErrorInfo(
        mutationError,
        "Не удалось удалить позицию из shortlist",
      );
      setMessage(
        getRateLimitAwareMessage(
          apiError,
          "Не удалось удалить позицию из shortlist. Попробуйте позже.",
        ),
      );
    }
  };

  const handleAddOne = async (item: FavoriteItem) => {
    if (!ensureAuthenticated()) {
      return;
    }

    try {
      setMessage(null);
      await addFavoriteToRequestBasket(item);
      setMessage(`Позиция «${item.clothes.clothes_name}» добавлена в список запроса.`);
    } catch (mutationError) {
      const apiError = extractApiErrorInfo(
        mutationError,
        "Не удалось добавить позицию в список запроса",
      );
      setMessage(
        getRateLimitAwareMessage(
          apiError,
          "Не удалось добавить позицию в список запроса. Попробуйте позже.",
        ),
      );
    }
  };

  const handleAddSelected = async () => {
    if (!selectedFavorites.length) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    setBatchState("adding");
    setMessage(null);

    try {
      for (const item of selectedFavorites) {
        await addFavoriteToRequestBasket(item);
      }

      setMessage(
        `В список запроса добавлено ${selectedFavorites.length} ${selectedFavorites.length === 1 ? "позиция" : selectedFavorites.length < 5 ? "позиции" : "позиций"}.`,
      );
    } catch (mutationError) {
      const apiError = extractApiErrorInfo(
        mutationError,
        "Не удалось подготовить shortlist к RFQ",
      );
      setMessage(
        getRateLimitAwareMessage(
          apiError,
          "Не удалось добавить shortlist в список запроса. Попробуйте позже.",
        ),
      );
    } finally {
      setBatchState("idle");
    }
  };

  return (
    <section className={scss.SavedShortlistSection}>
      <div className={scss.heroCard}>
        <div className={scss.heroCopy}>
          <span className={scss.eyebrow}>Client Cabinet</span>
          <h2>Сохраненные позиции ReaLab</h2>
          <p>
            Собирайте shortlist оборудования, отмечайте ключевые позиции и переводите их в request basket для RFQ, консультации или согласования поставки.
          </p>
        </div>

        <div className={scss.heroStats}>
          <article className={scss.statCard}>
            <span>В shortlist</span>
            <strong>{favorites.length}</strong>
          </article>
          <article className={scss.statCard}>
            <span>Выбрано для RFQ</span>
            <strong>{selectedIds.length}</strong>
          </article>
          <article className={scss.statCard}>
            <span>Ориентир по каталогу</span>
            <strong>
              {formatPrice(selectedIds.length ? selectedShortlistValue : totalShortlistValue)}
            </strong>
          </article>
        </div>
      </div>

      {message ? (
        <div className={scss.statusState} role="status">
          <p>{message}</p>
          <button type="button" onClick={() => setMessage(null)}>
            Закрыть
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className={scss.statusState}>
          <p>Загружаем shortlist оборудования...</p>
        </div>
      ) : isError ? (
        <div className={`${scss.statusState} ${scss.statusStateError}`} role="alert">
          <p>
            {getRateLimitAwareMessage(
              extractApiErrorInfo(error, "Не удалось загрузить shortlist"),
              "Не удалось загрузить shortlist. Попробуйте позже.",
            )}
          </p>
          <button type="button" onClick={() => void refetch()}>
            Повторить
          </button>
        </div>
      ) : favorites.length === 0 ? (
        <div className={scss.emptyState}>
          <FiBookmark className={scss.emptyIcon} />
          <h3>Shortlist пока пуст</h3>
          <p>
            Сохраняйте интересующие системы и позиции, чтобы быстро вернуться к ним при подготовке RFQ или внутреннего согласования.
          </p>
          <div className={scss.emptyActions}>
            <button type="button" className={scss.emptyPrimary} onClick={() => router.push("/catalog")}>
              Перейти в каталог
            </button>
            <Link href="/contacts" className={scss.emptySecondary}>
              Консультация ReaLab
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className={scss.toolbar}>
            <div className={scss.toolbarMeta}>
              <span>{favorites.length} позиций сохранено</span>
              <span>{selectedIds.length} выбрано для request basket</span>
            </div>

            <div className={scss.toolbarActions}>
              <button
                type="button"
                className={scss.secondaryGhost}
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === favorites.length ? [] : favorites.map((item) => item.id),
                  )
                }
              >
                {selectedIds.length === favorites.length ? "Снять выделение" : "Выбрать все"}
              </button>
              <button
                type="button"
                className={scss.primaryBatch}
                onClick={() => void handleAddSelected()}
                disabled={!selectedIds.length || batchState === "adding"}
              >
                <FiCheckCircle />
                {batchState === "adding"
                  ? "Добавляем..."
                  : `В request basket (${selectedIds.length})`}
              </button>
              <button
                type="button"
                className={scss.secondaryGhost}
                onClick={() => router.push("/cart")}
              >
                Открыть список запроса
                <FiArrowRight />
              </button>
            </div>
          </div>

          <div className={scss.grid}>
            {favorites.map((item) => {
              const image =
                resolveMediaUrl(item.clothes.clothes_img[0]?.photo) || "/fallback-image.png";
              const primaryVariant = getPrimaryVariant(item);
              const currentPrice = toNumber(item.clothes.discount_price || item.clothes.price);
              const basePrice = toNumber(item.clothes.price);
              const productHref = buildProductHref(item.clothes);
              const isSelected = selectedIds.includes(item.id);

              return (
                <article key={item.id} className={scss.card}>
                  <div className={scss.imageWrap}>
                    <button
                      type="button"
                      className={`${scss.selectToggle} ${isSelected ? scss.selectedToggle : ""}`}
                      onClick={() =>
                        setSelectedIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id],
                        )
                      }
                      aria-pressed={isSelected}
                    >
                      {isSelected ? "Выбрано" : "В shortlist"}
                    </button>

                    <button
                      type="button"
                      className={scss.favoriteButton}
                      onClick={(event) => void handleDeleteFavorite(event, item.id)}
                      aria-label="Удалить из сохраненных позиций"
                      disabled={isDeletingFavorite}
                    >
                      <FiTrash2 />
                    </button>

                    <Link href={productHref} className={scss.imageLink}>
                      <Image
                        src={image}
                        alt={item.clothes.clothes_name}
                        width={520}
                        height={420}
                        className={scss.mainImage}
                      />
                    </Link>
                  </div>

                  <div className={scss.cardInfo}>
                    <div className={scss.cardMeta}>
                      <span className={scss.metaLabel}>Saved shortlist</span>
                      <span className={scss.metaLabel}>
                        {item.clothes.clothes_img.length} исполн.
                      </span>
                    </div>

                    <h3>
                      <Link href={productHref}>{item.clothes.clothes_name}</Link>
                    </h3>

                    <p className={scss.variantLabel}>
                      {primaryVariant.size} · {primaryVariant.colorLabel}
                    </p>

                    <div className={scss.priceRow}>
                      <strong>{formatPrice(currentPrice)}</strong>
                      {basePrice > currentPrice ? <del>{formatPrice(basePrice)}</del> : null}
                    </div>

                    <div className={scss.cardActions}>
                      <button
                        type="button"
                        className={scss.primaryAction}
                        onClick={() => void handleAddOne(item)}
                      >
                        <FiPlus />
                        В список запроса
                      </button>
                      <Link href={productHref} className={scss.secondaryAction}>
                        Открыть
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default SavedShortlistSection;
