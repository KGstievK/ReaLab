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
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";

type OrderTab = "current" | "delivered";
type TimelineStatus =
  | "placed"
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "returned";

type OrderCard = IOrder;
type OrderItem = IOrder["cart"]["cart_items"][number];

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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачено",
  failed: "Ошибка оплаты",
  refunded: "Возврат",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mbank_redirect: "MBank",
  finca_qr: "FINCA Bank",
  manual: "Ручная обработка",
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  placed: "Создан",
  processing: "Собирается",
  shipping: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменен",
  returned: "Возврат",
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

const formatPrice = (value: string | number) => `${toNumber(value).toLocaleString("ru-RU")} KGS`;

const formatDate = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("ru-RU");
};

const normalize = (value: string) => value.trim().toLowerCase();

const formatPaymentStatus = (status?: string | null) =>
  status ? PAYMENT_STATUS_LABELS[normalize(status)] || status : "Не указан";

const formatPaymentMethod = (method?: string | null, provider?: string | null) => {
  if (method && PAYMENT_METHOD_LABELS[method]) {
    return PAYMENT_METHOD_LABELS[method];
  }

  if (provider) {
    return provider;
  }

  return "Не указан";
};

const formatShipmentStatus = (status?: string | null, fallback?: string | null) => {
  if (status) {
    const normalized = normalize(status);
    return SHIPMENT_STATUS_LABELS[normalized] || status;
  }

  return fallback || "Не указан";
};

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Ignore clipboard errors in unsupported browsers.
  }
};

const resolveOrderItemImage = (item: OrderItem) => {
  const selected = item.clothes.clothes_img.find((img) => {
    if (typeof item.color === "number") {
      return img.id === item.color;
    }

    return normalize(img.color) === normalize(item.color);
  });

  return resolveMediaUrl(selected?.photo || item.clothes.clothes_img[0]?.photo) || "/fallback-image.png";
};

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
    .map((item) => resolveOrderItemImage(item))
    .filter(Boolean);

const History = () => {
  const { data, isLoading, isError, error, refetch } = useGetOrderQuery();
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

  const getOrderDisplayNumber = (order: OrderCard) => order.order_number || `#${order.id}`;

  const renderStatusPanel = () => {
    if (!selectedOrder) {
      return null;
    }

    const normalizedStatus = normalizeOrderStatus(selectedOrder.order_status);
    const currentIndex = WORKFLOW.indexOf(normalizedStatus);
    const paymentStatus = formatPaymentStatus(selectedOrder.payment?.status);
    const paymentMethod = formatPaymentMethod(
      selectedOrder.payment?.method,
      selectedOrder.payment?.provider,
    );

    return (
      <div ref={statusPanelRef} className={styles.statusPanel}>
        <div className={styles.statusPanelHeader}>
          <h3>{STATUS_MESSAGES[normalizedStatus]}</h3>
          <p>Мы показываем текущий статус доставки и оплаты по выбранному заказу.</p>
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

        <p className={styles.statusMessage}>{STATUS_MESSAGES[normalizedStatus]}</p>

        <div className={styles.statusMeta}>
          <div className={styles.statusMetaItem}>
            <span>Дата заказа</span>
            <strong>{formatDate(selectedOrder.date)}</strong>
          </div>
          <div className={styles.statusMetaItem}>
            <span>Всего</span>
            <strong>{formatPrice(selectedOrder.cart.total_price)}</strong>
          </div>
          <div className={styles.statusMetaItem}>
            <span>Номер заказа</span>
            <strong>{getOrderDisplayNumber(selectedOrder)}</strong>
          </div>
        </div>

        <div className={styles.paymentSummary}>
          <div className={styles.paymentSummaryCard}>
            <span>Статус оплаты</span>
            <strong>{paymentStatus}</strong>
            <small>{paymentMethod}</small>
          </div>

          <div className={styles.paymentSummaryCard}>
            <span>Статус доставки</span>
            <strong>
              {formatShipmentStatus(selectedOrder.shipment?.status, selectedOrder.delivery)}
            </strong>
            <small>
              {selectedOrder.shipment?.service_name ||
                selectedOrder.shipment?.carrier ||
                "Без уточнённого сервиса"}
            </small>
          </div>
        </div>

        {selectedOrder.payment?.status !== "paid" && selectedOrder.payment_session ? (
          <div className={styles.paymentActions}>
            <div className={styles.paymentActionCard}>
              <span>Код оплаты</span>
              <strong>{selectedOrder.payment_session.reference}</strong>
              <small>
                {selectedOrder.payment_session.kind === "redirect"
                  ? "Продолжите оплату через MBank или используйте код сессии."
                  : selectedOrder.payment_session.kind === "qr"
                    ? "Используйте QR-сессию FINCA для оплаты."
                    : "Заказ ждёт ручного подтверждения оплаты."}
              </small>
            </div>

            <div className={styles.paymentActionButtons}>
              {selectedOrder.payment_session.kind === "redirect" &&
              selectedOrder.payment_session.redirect_url ? (
                <button
                  type="button"
                  className={styles.paymentButtonPrimary}
                  onClick={() =>
                    window.open(
                      selectedOrder.payment_session?.redirect_url || "",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  Продолжить оплату
                </button>
              ) : null}

              <button
                type="button"
                className={styles.paymentButtonSecondary}
                onClick={() => void copyToClipboard(selectedOrder.payment_session?.reference || "")}
              >
                Скопировать код оплаты
              </button>

              {selectedOrder.payment_session.kind === "qr" &&
              selectedOrder.payment_session.qr_payload ? (
                <button
                  type="button"
                  className={styles.paymentButtonSecondary}
                  onClick={() =>
                    void copyToClipboard(selectedOrder.payment_session?.qr_payload || "")
                  }
                >
                  Скопировать QR-сессию
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section className={styles.History}>
      <h2 className={styles.title}>{"История заказов"}</h2>
      <p className={styles.subtitle}>
        {"Отслеживание статусов, доставки и оплаты ваших заказов"}
      </p>

      {isLoading && !data ? (
        <div className={styles.statusState}>
          <p>Загружаем историю заказов...</p>
        </div>
      ) : null}

      {isError && !data ? (
        <div className={`${styles.statusState} ${styles.statusStateError}`} role="alert">
          <p>
            {getRateLimitAwareMessage(
              extractApiErrorInfo(error, "Не удалось загрузить историю заказов"),
              "Не удалось загрузить историю заказов. Попробуйте позже.",
            )}
          </p>
          <button type="button" onClick={() => void refetch()}>
            Повторить
          </button>
        </div>
      ) : null}

      {!isLoading && !isError ? <div className={styles.tabs} role="tablist" aria-label="Категории заказов">
        <button
          type="button"
          className={`${styles.tab} ${tab === "current" ? styles.active : ""}`}
          onClick={() => setTab("current")}
          role="tab"
          id="history-tab-current"
          aria-selected={tab === "current"}
          aria-controls="history-orders-panel"
        >
          {"Текущие"}
          <span className={`${styles.tabBadge} ${currentOrders.length > 0 ? styles.tabBadgeFilled : ""}`}>
            {currentOrders.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.tab} ${tab === "delivered" ? styles.active : ""}`}
          onClick={() => setTab("delivered")}
          role="tab"
          id="history-tab-delivered"
          aria-selected={tab === "delivered"}
          aria-controls="history-orders-panel"
        >
          {"Доставленные"}
          <span className={`${styles.tabBadge} ${deliveredOrders.length > 0 ? styles.tabBadgeFilled : ""}`}>
            {deliveredOrders.length}
          </span>
        </button>
      </div> : null}

      {!isLoading && !isError ? renderStatusPanel() : null}

      {!isLoading && !isError && visibleOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {tab === "current"
              ? "У вас нет текущих заказов"
              : "У вас нет доставленных заказов"}
          </p>
        </div>
      ) : !isLoading && !isError ? (
        <div
          id="history-orders-panel"
          className={styles.content}
          role="tabpanel"
          aria-labelledby={tab === "current" ? "history-tab-current" : "history-tab-delivered"}
        >
          {visibleOrders.map((order) => (
            <article key={order.id} className={styles.orderCard}>
              <div className={styles.orderMeta}>
                <div className={styles.metaItem}>
                  <span>{"Номер заказа"}</span>
                  <strong>{getOrderDisplayNumber(order)}</strong>
                </div>

                <div className={styles.metaItem}>
                  <span>{"Всего"}</span>
                  <strong>{formatPrice(order.cart.total_price)}</strong>
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
      ) : null}
    </section>
  );
};

export default History;
