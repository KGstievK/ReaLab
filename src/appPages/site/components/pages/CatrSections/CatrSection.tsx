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
const DISCOUNT_PRICE = 600;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSom = (value: number) => `${value.toLocaleString("ru-RU")}c`;

const CatrSection = () => {
  const { data: cart, refetch, isLoading } = useGetCartQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [basketData, setBasketData] = useState<CartItem[]>([]);
  const [updateMutation] = useUpdateBasketMutation();
  const [deleteMutation] = useDeleteBasketMutation();
  const router = useRouter();

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

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) {
      return;
    }

    try {
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
          sameItems.reduce((total, item) => total + item.quantity, 0) +
          quantity;

        for (const item of sameItems) {
          await deleteMutation(item.id).unwrap();
        }

        await updateMutation({
          id: itemId,
          updateBasket: { quantity: mergedQuantity },
        }).unwrap();
      } else {
        await updateMutation({
          id: itemId,
          updateBasket: { quantity },
        }).unwrap();
      }

      await refetch();
    } catch (error) {
      console.error("Error updating basket:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation(id).unwrap();
      await refetch();
      setBasketData((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleGoToCatalog = () => {
    router.push("/catalog");
  };

  const handleGoToCheckout = () => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(basketData));
      router.push("/cart/checkout");
    } catch (error) {
      console.error("Error while moving to checkout:", error);
    }
  };

  const calculatedSubtotal = basketData.reduce(
    (sum, item) => sum + toNumber(item.total_price),
    0,
  );
  const subtotal = toNumber(normalizedCart?.total_price) || calculatedSubtotal;
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

          <h1 className="title">Корзина</h1>

          {isLoading ? (
            <div className={scss.loadingState}>Загрузка корзины...</div>
          ) : basketData.length > 0 ? (
            <div className={scss.cartLayout}>
              <div className={scss.itemsColumn}>
                <div className={scss.tableHead}>
                  <p>Продукт</p>
                  <p>Цена</p>
                  <p>Количество</p>
                  <p>Всего</p>
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
                        >
                          ×
                        </button>

                        <div className={scss.productCell}>
                          <Image
                            width={130}
                            height={130}
                            src={selectedImage?.photo || "/fallback-image.png"}
                            alt={item.clothes.clothes_name}
                          />
                          <div className={scss.productInfo}>
                            <h3>{item.clothes.clothes_name}</h3>
                            <p>{selectedImage?.color || "Цвет не указан"}</p>
                          </div>
                        </div>

                        <p className={scss.priceCell}>
                          {formatSom(toNumber(item.just_price))}
                        </p>

                        <div className={scss.quantityCell}>
                          <div className={scss.counter}>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className={scss.deleteButton}
                            onClick={() => handleDelete(item.id)}
                          >
                            удалить
                          </button>
                        </div>

                        <p className={scss.totalCell}>
                          {formatSom(toNumber(item.total_price))}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>

              <aside className={scss.summaryCard}>
                <h2>Детали оплаты</h2>

                <div className={scss.summaryItems}>
                  {basketData.map((item) => {
                    const selectedImage = item.clothes.clothes_img.find(
                      (img) => img.id === item.color,
                    );

                    return (
                      <div
                        key={`summary-${item.id}`}
                        className={scss.summaryItem}
                      >
                        <Image
                          width={91}
                          height={98}
                          src={selectedImage?.photo || "/fallback-image.png"}
                          alt={item.clothes.clothes_name}
                        />
                        <div className={scss.summaryItemText}>
                          <h3>{item.clothes.clothes_name}</h3>
                          <p>{selectedImage?.color || "Цвет не указан"}</p>
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
                    <span>Итог</span>
                    <span>{formatSom(subtotal)}</span>
                  </div>
                  <div className={scss.row}>
                    <span>Доставка</span>
                    <span>{formatSom(delivery)}</span>
                  </div>
                  <div className={scss.row}>
                    <span>Скидка</span>
                    <span>-{formatSom(discount)}</span>
                  </div>
                  <div className={`${scss.row} ${scss.totalRow}`}>
                    <span>Итого к оплате:</span>
                    <span>{formatSom(payableTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={scss.checkoutButton}
                  onClick={handleGoToCheckout}
                >
                  <span className={scss.desktopButtonLabel}>
                    Оформить заказ
                  </span>
                  <span className={scss.mobileButtonLabel}>
                    Посмотреть все →
                  </span>
                </button>
              </aside>
            </div>
          ) : (
            <div className={scss.emptyState}>
              <Image src={imgBasket} alt="Корзина пуста" />
              <h2>Ваша корзина пуста</h2>
              <p>
                Похоже, вы еще не добавили в корзину никаких товаров. Начните
                делать покупки, чтобы заполнить ее.
              </p>
              <button type="button" onClick={handleGoToCatalog}>
                Добавить товар
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CatrSection;
