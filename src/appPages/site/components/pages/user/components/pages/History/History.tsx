"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useGetOrderQuery } from "../../../../../../../../redux/api/product";
import styles from "./History.module.scss";

type OrderTab = "current" | "delivered";

interface OrderItem {
  id?: number;
  color: number;
  clothes: {
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
}

interface OrderCard {
  id: number;
  date: string;
  order_status: string;
  cart: {
    id: number;
    user: number;
    total_price: string | number;
    cart_items: OrderItem[];
  };
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSom = (value: string | number) =>
  `${toNumber(value).toLocaleString("ru-RU")}\u0441`;

const formatDate = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("ru-RU");
};

const normalize = (value: string) => value.trim().toLowerCase();

const isDeliveredStatus = (status: string) => {
  const normalized = normalize(status);
  return (
    normalized.includes("\u0434\u043e\u0441\u0442\u0430\u0432") ||
    normalized.includes("delivered") ||
    normalized.includes("\u043f\u043e\u043b\u0443\u0447")
  );
};

const getOrderImages = (order: OrderCard) =>
  order.cart.cart_items
    .map((item) => {
      const selected = item.clothes.clothes_img.find((img) => img.id === item.color);
      return selected?.photo || item.clothes.clothes_img[0]?.photo || "/fallback-image.png";
    })
    .filter(Boolean);

const History = () => {
  const { data } = useGetOrderQuery();
  const [tab, setTab] = useState<OrderTab>("current");

  const orders: OrderCard[] = useMemo(
    () => (Array.isArray(data) ? (data as OrderCard[]) : []),
    [data],
  );

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [orders],
  );

  const currentOrders = useMemo(
    () => sortedOrders.filter((order) => !isDeliveredStatus(order.order_status)),
    [sortedOrders],
  );

  const deliveredOrders = useMemo(
    () => sortedOrders.filter((order) => isDeliveredStatus(order.order_status)),
    [sortedOrders],
  );

  useEffect(() => {
    if (deliveredOrders.length > 0) {
      setTab("delivered");
      return;
    }

    setTab("current");
  }, [deliveredOrders.length]);

  const visibleOrders = tab === "current" ? currentOrders : deliveredOrders;

  const renderThumbs = (order: OrderCard) => {
    const images = getOrderImages(order);
    const visible = images.slice(0, 4);
    const hiddenCount = Math.max(images.length - 4, 0);

    return (
      <div className={styles.orderItems}>
        {visible.map((photo, idx) => (
          <div key={`${order.id}-img-${idx}`} className={styles.item}>
            <Image
              src={photo}
              alt={"\u0422\u043e\u0432\u0430\u0440"}
              width={162}
              height={112}
            />
          </div>
        ))}

        {hiddenCount > 0 && <div className={styles.more}>+{hiddenCount}</div>}
      </div>
    );
  };

  return (
    <section className={styles.History}>
      <h2 className={styles.title}>
        {"\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0437\u0430\u043a\u0430\u0437\u043e\u0432"}
      </h2>
      <p className={styles.subtitle}>
        {
          "\u041e\u0442\u0441\u043b\u0435\u0436\u0438\u0432\u0430\u043d\u0438\u0435, \u0432\u043e\u0437\u0432\u0440\u0430\u0442 \u0438\u043b\u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u0430 \u0442\u043e\u0432\u0430\u0440\u043e\u0432"
        }
      </p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === "current" ? styles.active : ""}`}
          onClick={() => setTab("current")}
        >
          {"\u0422\u0435\u043a\u0443\u0449\u0438\u0439"}
          <span className={`${styles.tabBadge} ${currentOrders.length > 0 ? styles.tabBadgeFilled : ""}`}>
            {currentOrders.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.tab} ${tab === "delivered" ? styles.active : ""}`}
          onClick={() => setTab("delivered")}
        >
          {"\u0414\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d"}
          <span className={`${styles.tabBadge} ${deliveredOrders.length > 0 ? styles.tabBadgeFilled : ""}`}>
            {deliveredOrders.length}
          </span>
        </button>
      </div>

      {visibleOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {tab === "current"
              ? "\u0423 \u0432\u0430\u0441 \u043d\u0435\u0442 \u0442\u0435\u043a\u0443\u0449\u0438\u0445 \u0437\u0430\u043a\u0430\u0437\u043e\u0432"
              : "\u0423 \u0432\u0430\u0441 \u043d\u0435\u0442 \u0434\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u043d\u044b\u0445 \u0437\u0430\u043a\u0430\u0437\u043e\u0432"}
          </p>
        </div>
      ) : (
        <div className={styles.content}>
          {visibleOrders.map((order) => (
            <article key={order.id} className={styles.orderCard}>
              <div className={styles.orderMeta}>
                <div className={styles.metaItem}>
                  <span>{"\u041d\u043e\u043c\u0435\u0440 \u0437\u0430\u043a\u0430\u0437\u0430"}</span>
                  <strong>#{order.id}</strong>
                </div>

                <div className={styles.metaItem}>
                  <span>{"\u0412\u0441\u0435\u0433\u043e"}</span>
                  <strong>{formatSom(order.cart.total_price)}</strong>
                </div>

                <div className={styles.metaItem}>
                  <span>
                    {tab === "delivered"
                      ? "\u0414\u0430\u0442\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438"
                      : "\u0414\u0430\u0442\u0430 \u0437\u0430\u043a\u0430\u0437\u0430"}
                  </span>
                  <strong>{formatDate(order.date)}</strong>
                </div>
              </div>

              {renderThumbs(order)}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default History;
