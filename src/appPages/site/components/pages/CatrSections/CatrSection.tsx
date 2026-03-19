"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import imgBasket from "@/assets/images/basket.svg";
import backIcon from "@/assets/icons/backIcon.svg";
import scss from "./CatrSection.module.scss";
import {
  useDeleteBasketMutation,
  useGetCartQuery,
  useUpdateBasketMutation,
} from "../../../../../redux/api/product";
import { resolveMediaUrl } from "@/utils/media";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";

interface CartItem {
  id: number;
  size: string;
  clothes_id: number;
  quantity: number;
  price_clothes: number | string;
  just_price: number | string;
  total_price: number | string;
  color: number;
  clothes: {
    clothes_name: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
}

interface CartResponse {
  id: number;
  user: number;
  total_price: number | string;
  cart_items: CartItem[];
}

const DELIVERY_PRICE = 200;
const DISCOUNT_PRICE = 0;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: number) => `${value.toLocaleString("ru-RU")} KGS`;

const withUpdatedQuantity = (item: CartItem, quantity: number): CartItem => ({
  ...item,
  quantity,
  total_price: toNumber(item.just_price) * quantity,
});

const CatrSection = () => {
  const {
    data: cart,
    refetch,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetCartQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [basketData, setBasketData] = useState<CartItem[]>([]);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [updateMutation, { isLoading: isUpdatingBasket }] = useUpdateBasketMutation();
  const [deleteMutation, { isLoading: isDeletingBasket }] = useDeleteBasketMutation();
  const router = useRouter();

  const isMutating = isUpdatingBasket || isDeletingBasket;

  const normalizedCart = useMemo<CartResponse | undefined>(() => {
    if (Array.isArray(cart)) {
      return cart[0] as CartResponse | undefined;
    }

    return cart as CartResponse | undefined;
  }, [cart]);

  useEffect(() => {
    if (normalizedCart?.cart_items?.length) {
      setBasketData(normalizedCart.cart_items);
      return;
    }

    setBasketData([]);
  }, [normalizedCart]);

  useEffect(() => {
    if (!isError) {
      return;
    }

    const apiError = extractApiErrorInfo(error, "Не удалось загрузить корзину");
    setCartNotice(
      getRateLimitAwareMessage(apiError, "Не удалось загрузить корзину. Попробуйте позже."),
    );
  }, [error, isError]);

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) {
      return;
    }

    const previousBasketData = basketData;

    try {
      setCartNotice(null);
      const currentItem = basketData.find((item) => item.id === itemId);
      if (!currentItem) {
        return;
      }

      const sameItems = basketData.filter(
        (item) =>
          item.clothes_id === currentItem.clothes_id &&
          item.size === currentItem.size &&
          item.color === currentItem.color &&
          item.id !== itemId,
      );

      if (sameItems.length > 0) {
        const mergedQuantity =
          sameItems.reduce((total, item) => total + item.quantity, 0) + quantity;

        setBasketData(
          basketData
            .filter((item) => !sameItems.some((same) => same.id === item.id))
            .map((item) =>
              item.id === itemId ? withUpdatedQuantity(item, mergedQuantity) : item,
            ),
        );

        for (const item of sameItems) {
          await deleteMutation(item.id).unwrap();
        }

        await updateMutation({
          id: itemId,
          updateBasket: { quantity: mergedQuantity },
        }).unwrap();
      } else {
        setBasketData(
          basketData.map((item) =>
            item.id === itemId ? withUpdatedQuantity(item, quantity) : item,
          ),
        );

        await updateMutation({
          id: itemId,
          updateBasket: { quantity },
        }).unwrap();
      }

      void refetch();
    } catch (mutationError) {
      setBasketData(previousBasketData);
      const apiError = extractApiErrorInfo(mutationError, "Не удалось обновить корзину");
      setCartNotice(
        getRateLimitAwareMessage(apiError, "Не удалось обновить корзину. Попробуйте ещё раз."),
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setCartNotice(null);
      await deleteMutation(id).unwrap();
      await refetch();
      setBasketData((prev) => prev.filter((item) => item.id !== id));
    } catch (mutationError) {
      const apiError = extractApiErrorInfo(mutationError, "Не удалось удалить товар");
      setCartNotice(
        getRateLimitAwareMessage(apiError, "Не удалось удалить товар. Попробуйте ещё раз."),
      );
    }
  };

  const handleGoToCatalog = () => {
    router.push("/catalog");
  };

  const handleGoToCheckout = () => {
    if (basketData.length === 0) {
      return;
    }

    try {
      setCartNotice(null);
      localStorage.setItem("cartItems", JSON.stringify(basketData));
      router.push("/cart/checkout");
    } catch {
      setCartNotice("Не удалось подготовить корзину к оформлению. Попробуйте ещё раз.");
    }
  };

  const calculatedSubtotal = basketData.reduce(
    (sum, item) => sum + toNumber(item.total_price),
    0,
  );
  const subtotal =
    basketData.length > 0 ? calculatedSubtotal : toNumber(normalizedCart?.total_price);
  const delivery = basketData.length > 0 ? DELIVERY_PRICE : 0;
  const discount = basketData.length > 0 ? DISCOUNT_PRICE : 0;
  const payableTotal = Math.max(subtotal + delivery - discount, 0);

  return (
    <section className={scss.CatrSection}>
      <div className="container">
        <div className={scss.content}>
          <nav className={scss.breadcrumbs} aria-label="breadcrumb">
            <button
              type="button"
              className={scss.backButton}
              aria-label="Назад"
              onClick={() => router.back()}
            >
              <Image src={backIcon} alt="" />
            </button>
            <Link href="/">Главная</Link>
            <span>/</span>
            <span className={scss.current}>Корзина</span>
          </nav>

          <h1 className={scss.pageTitle}>Корзина</h1>

          {cartNotice ? (
            <div className={`${scss.statusState} ${scss.statusStateError}`} role="alert">
              <p>{cartNotice}</p>
              <button type="button" onClick={() => void refetch()}>
                Повторить
              </button>
            </div>
          ) : null}

          {isLoading && !normalizedCart ? (
            <div className={scss.loadingState}>Загружаем корзину...</div>
          ) : isError && !normalizedCart ? (
            <div className={`${scss.statusState} ${scss.statusStateError}`} role="alert">
              <p>Не удалось загрузить корзину.</p>
              <button type="button" onClick={() => void refetch()}>
                Попробовать снова
              </button>
            </div>
          ) : basketData.length > 0 ? (
            <div className={scss.cartLayout}>
              <div className={scss.itemsColumn}>
                <div className={scss.tableHead}>
                  <p>Оборудование</p>
                  <p>Цена</p>
                  <p>Количество</p>
                  <p>Сумма</p>
                </div>

                <div className={scss.itemsList}>
                  {basketData.map((item) => {
                    const selectedImage = item.clothes.clothes_img.find(
                      (img) => img.id === item.color,
                    );

                    return (
                      <article key={item.id} className={scss.itemRow}>
                        <button
                          type="button"
                          className={scss.mobileRemoveButton}
                          onClick={() => handleDelete(item.id)}
                          aria-label="Удалить товар"
                          disabled={isMutating}
                        >
                          ×
                        </button>

                        <div className={scss.productCell}>
                          <Image
                            width={130}
                            height={130}
                            src={resolveMediaUrl(selectedImage?.photo) || "/fallback-image.png"}
                            alt={item.clothes.clothes_name}
                          />
                          <div className={scss.productInfo}>
                            <h3>{item.clothes.clothes_name}</h3>
                            <p>{selectedImage?.color || "Финиш не указан"}</p>
                          </div>
                        </div>

                        <p className={scss.priceCell}>{formatPrice(toNumber(item.just_price))}</p>

                        <div className={scss.quantityCell}>
                          <div className={scss.counter}>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={isMutating || item.quantity <= 1}
                              aria-label="Уменьшить количество"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isMutating}
                              aria-label="Увеличить количество"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className={scss.deleteButton}
                            onClick={() => handleDelete(item.id)}
                            disabled={isMutating}
                          >
                            удалить
                          </button>
                        </div>

                        <p className={scss.totalCell}>{formatPrice(toNumber(item.total_price))}</p>
                      </article>
                    );
                  })}
                </div>
              </div>

              <aside className={scss.summaryCard}>
                <h2>Сводка заказа</h2>

                <div className={scss.summaryItems}>
                  {basketData.map((item) => {
                    const selectedImage = item.clothes.clothes_img.find(
                      (img) => img.id === item.color,
                    );

                    return (
                      <div key={`summary-${item.id}`} className={scss.summaryItem}>
                        <Image
                          width={91}
                          height={98}
                          src={resolveMediaUrl(selectedImage?.photo) || "/fallback-image.png"}
                          alt={item.clothes.clothes_name}
                        />
                        <div className={scss.summaryItemText}>
                          <h3>{item.clothes.clothes_name}</h3>
                          <p>{selectedImage?.color || "Финиш не указан"}</p>
                          <p>
                            {item.quantity} x {toNumber(item.just_price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={scss.summaryRows}>
                  <div className={scss.row}>
                    <span>Оборудование</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className={scss.row}>
                    <span>Доставка</span>
                    <span>{formatPrice(delivery)}</span>
                  </div>
                  <div className={scss.row}>
                    <span>Скидка</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                  <div className={`${scss.row} ${scss.totalRow}`}>
                    <span>Итого к оплате:</span>
                    <span>{formatPrice(payableTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={scss.checkoutButton}
                  onClick={handleGoToCheckout}
                  disabled={isMutating || isFetching || basketData.length === 0}
                >
                  <span className={scss.desktopButtonLabel}>
                    {isMutating ? "Обновляем корзину..." : "Перейти к оформлению"}
                  </span>
                  <span className={scss.mobileButtonLabel}>
                    {isMutating ? "Обновляем..." : "К checkout →"}
                  </span>
                </button>
              </aside>
            </div>
          ) : (
            <div className={scss.emptyState}>
              <Image src={imgBasket} alt="Корзина пуста" />
              <h2>Корзина пока пуста</h2>
              <p>
                Вы еще не добавили оборудование в корзину. Перейдите в каталог,
                чтобы собрать поставку или запрос на коммерческое предложение.
              </p>
              <button type="button" onClick={handleGoToCatalog}>
                Перейти в каталог
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CatrSection;
