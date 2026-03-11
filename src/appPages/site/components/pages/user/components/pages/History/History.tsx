﻿"use client";

import Image from "next/image";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { FaBoxOpen } from "react-icons/fa6";
import { GrBasket } from "react-icons/gr";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { TbTruckDelivery } from "react-icons/tb";
import { useGetOrderQuery } from "../../../../../../../../redux/api/product";
import styles from "./History.module.scss";
import { resolveMediaUrl } from "@/utils/media";

type OrderTab = "current" | "delivered";
type TimelineStatus =
  | "placed"
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "returned";

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

const STATUS_LABELS: Record<TimelineStatus, string> = {
  placed: "Заказ размещен",
  processing: "Собирается",
  shipping: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
  returned: "Возврат",
};

const STATUS_MESSAGES: Record<TimelineStatus, string> = {
  placed: "Ваш заказ размещен.",
  processing: "Ваш заказ собирается.",
  shipping: "Ваш заказ в пути.",
  delivered: "Ваш заказ доставлен.",
  cancelled: "Ваш заказ отменен.",
  returned: "Заказ находится в статусе возврата.",
};

const WORKFLOW: TimelineStatus[] = ["placed", "processing", "shipping", "delivered"];

const TIMELINE_ITEMS: Array<{
  status: Extract<TimelineStatus, "placed" | "processing" | "shipping" | "delivered">;
  label: string;
  icon: ReactNode;
}> = [
  {
    status: "placed",
    label: "Заказ размещен",
    icon: <GrBasket />,
  },
  {
    status: "processing",
    label: "Собирается",
    icon: <HiOutlineArrowPath />,
  },
  {
    status: "shipping",
    label: "В пути",
    icon: <TbTruckDelivery />,
  },
  {
    status: "delivered",
    label: "Доставлен",
    icon: <FaBoxOpen />,
  },
];

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSom = (value: string | number) => `${toNumber(value).toLocaleString("ru-RU")}с`;

const formatDate = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("ru-RU");
};

const normalize = (value: string) => value.trim().toLowerCase();

const normalizeOrderStatus = (status: string): TimelineStatus => {
  const normalized = normalize(status);

  if (normalized.includes("cancel") || normalized.includes("отмен")) {
    return "cancelled";
  }
  if (normalized.includes("return") || normalized.includes("возврат")) {
    return "returned";
  }
  if (
    normalized.includes("delivered") ||
    normalized.includes("достав") ||
    normalized.includes("получ")
  ) {
    return "delivered";
  }
  if (normalized.includes("shipping") || normalized.includes("в пути")) {
    return "shipping";
  }
  if (
    normalized.includes("processing") ||
    normalized.includes("packaging") ||
    normalized.includes("обработ") ||
    normalized.includes("собира")
  ) {
    return "processing";
  }

  return "placed";
};

const isDeliveredStatus = (status: string) => normalizeOrderStatus(status) === "delivered";

const getOrderImages = (order: OrderCard) =>
  order.cart.cart_items
    .map((item) => {
      const selected = item.clothes.clothes_img.find((img) => img.id === item.color);
      return (
        resolveMediaUrl(selected?.photo || item.clothes.clothes_img[0]?.photo) ||
        "/fallback-image.png"
      );
    })
    .filter(Boolean);

const History = () => {
  const { data } = useGetOrderQuery();
  const [tab, setTab] = useState<OrderTab>("current");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const statusPanelRef = useRef<HTMLDivElement | null>(null);

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
    if (tab === "current" && currentOrders.length === 0 && deliveredOrders.length > 0) {
      setTab("delivered");
    }
    if (tab === "delivered" && deliveredOrders.length === 0 && currentOrders.length > 0) {
      setTab("current");
    }
  }, [currentOrders.length, deliveredOrders.length, tab]);

  const visibleOrders = tab === "current" ? currentOrders : deliveredOrders;

  const selectedOrder = useMemo(
    () => visibleOrders.find((order) => order.id === selectedOrderId) ?? null,
    [selectedOrderId, visibleOrders],
  );

  useEffect(() => {
    if (selectedOrderId && !visibleOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(null);
    }
  }, [selectedOrderId, visibleOrders]);

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    requestAnimationFrame(() => {
      statusPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [selectedOrder]);

  const handleStatusToggle = (orderId: number) => {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const renderThumbs = (order: OrderCard) => {
    const images = getOrderImages(order);
    const visible = images.slice(0, 4);
    const hiddenCount = Math.max(images.length - 4, 0);

    return (
      <div className={styles.orderItems}>
        {visible.map((photo, idx) => (
          <div key={`${order.id}-img-${idx}`} className={styles.item}>
            <Image src={photo} alt={"Товар"} width={162} height={112} />
          </div>
        ))}

        {hiddenCount > 0 && <div className={styles.more}>+{hiddenCount}</div>}
      </div>
    );
  };

  const renderStatusPanel = () => {
    if (!selectedOrder) {
      return null;
    }

    const normalizedStatus = normalizeOrderStatus(selectedOrder.order_status);
    const currentIndex = WORKFLOW.indexOf(normalizedStatus);

    return (
      <div ref={statusPanelRef} className={styles.statusPanel}>
        <div className={styles.statusPanelHeader}>
          <h3>{STATUS_MESSAGES[normalizedStatus]}</h3>
          {/* <p>
            {
              "Отслеживание, возврат или покупка товаров"
            }
          </p> */}
        </div>

        <div className={styles.statusTimeline}>
          {TIMELINE_ITEMS.map((item, index) => {
            const isActive = normalizedStatus === item.status;
            const isCompleted = currentIndex >= index && currentIndex >= 0;

            return (
              <div
                key={`${selectedOrder.id}-${item.status}`}
                className={`${styles.timelineItem} ${
                  isActive
                    ? styles.timelineItemActive
                    : isCompleted
                      ? styles.timelineItemCompleted
                      : ""
                }`}
              >
                <div className={styles.timelineIcon}>{item.icon}</div>
                <p>{item.label}</p>
              </div>
            );
          })}
        </div>

        <p className={styles.statusMessage}></p>

        {/* <div className={styles.statusMeta}>
          <div className={styles.statusMetaItem}>
            <span>{"Дата заказа"}</span>
            <strong>{formatDate(selectedOrder.date)}</strong>
          </div>
          <div className={styles.statusMetaItem}>
            <span>{"Всего"}</span>
            <strong>{formatSom(selectedOrder.cart.total_price)}</strong>
          </div>
          <div className={styles.statusMetaItem}>
            <span>{"Номер заказа"}</span>
            <strong>#{selectedOrder.id}</strong>
          </div>
        </div> */}

        {/* {renderThumbs(selectedOrder)} */}
      </div>
    );
  };

  return (
    <section className={styles.History}>
      <h2 className={styles.title}>{"История заказов"}</h2>
      <p className={styles.subtitle}>
        {
          "Отслеживание, возврат или покупка товаров"
        }
      </p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === "current" ? styles.active : ""}`}
          onClick={() => setTab("current")}
        >
          {"Текущий"}
          <span className={`${styles.tabBadge} ${currentOrders.length > 0 ? styles.tabBadgeFilled : ""}`}>
            {currentOrders.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.tab} ${tab === "delivered" ? styles.active : ""}`}
          onClick={() => setTab("delivered")}
        >
          {"Доставлен"}
          <span className={`${styles.tabBadge} ${deliveredOrders.length > 0 ? styles.tabBadgeFilled : ""}`}>
            {deliveredOrders.length}
          </span>
        </button>
      </div>

      {renderStatusPanel()}

      {visibleOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {tab === "current"
              ? "У вас нет текущих заказов"
              : "У вас нет доставленных заказов"}
          </p>
        </div>
      ) : (
        <div className={styles.content}>
          {visibleOrders.map((order) => (
            <article key={order.id} className={styles.orderCard}>
              <div className={styles.orderMeta}>
                <div className={styles.metaItem}>
                  <span>{"Номер заказа"}</span>
                  <strong>#{order.id}</strong>
                </div>

                <div className={styles.metaItem}>
                  <span>{"Всего"}</span>
                  <strong>{formatSom(order.cart.total_price)}</strong>
                </div>

                <div className={styles.metaItem}>
                  <span>
                    {tab === "delivered"
                      ? "Дата доставки"
                      : "Дата заказа"}
                  </span>
                  <strong>{formatDate(order.date)}</strong>
                </div>

                <div className={styles.metaAction}>
                  <button
                    type="button"
                    className={`${styles.statusAction} ${
                      selectedOrder?.id === order.id ? styles.statusActionActive : ""
                    }`}
                    onClick={() => handleStatusToggle(order.id)}
                    aria-expanded={selectedOrder?.id === order.id}
                  >
                    {"Статус заказа"}
                  </button>
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
