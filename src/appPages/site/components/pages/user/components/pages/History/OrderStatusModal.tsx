"use client";

import Image from "next/image";
import React from "react";
import { FaBoxOpen } from "react-icons/fa6";
import { GrBasket } from "react-icons/gr";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { TbTruckDelivery } from "react-icons/tb";
import { resolveMediaUrl } from "@/utils/media";
import styles from "./OrderStatusModal.module.scss";

type TimelineStatus = "placed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned";

interface CartItem {
  clothes: {
    clothes_name?: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  color: number | string;
}

interface Cart {
  total_price: string;
  user: number;
  cart_items: CartItem[];
}

interface ModalOrder {
  id?: number;
  order_number?: string;
  order_status: string;
  date: string;
  cart: Cart;
}

interface OrderStatusModalProps {
  isOpen: boolean;
  inClose: () => void;
  order_status: ModalOrder;
}

const normalize = (value: string) => value.trim().toLowerCase();

const normalizeOrderStatus = (status: string): TimelineStatus => {
  const normalized = normalize(status);

  if (normalized.includes("cancel") || normalized.includes("отмен")) {
    return "cancelled";
  }
  if (normalized.includes("return") || normalized.includes("возврат")) {
    return "returned";
  }
  if (normalized.includes("delivered") || normalized.includes("достав") || normalized.includes("получ")) {
    return "delivered";
  }
  if (normalized.includes("shipping") || normalized.includes("в пути")) {
    return "shipping";
  }
  if (normalized.includes("processing") || normalized.includes("packaging") || normalized.includes("обработ") || normalized.includes("собира")) {
    return "processing";
  }

  return "placed";
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
  icon: React.ReactNode;
}> = [
  { status: "placed", label: "Заказ размещен", icon: <GrBasket /> },
  { status: "processing", label: "Собирается", icon: <HiOutlineArrowPath /> },
  { status: "shipping", label: "В пути", icon: <TbTruckDelivery /> },
  { status: "delivered", label: "Доставлен", icon: <FaBoxOpen /> },
];

const formatDate = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("ru-RU");
};

const formatSom = (value: string) => `${Number(value || 0).toLocaleString("ru-RU")}с`;

const resolveOrderItemImage = (item: CartItem) => {
  const selected = item.clothes.clothes_img.find((img) => {
    if (typeof item.color === "number") {
      return img.id === item.color;
    }

    return normalize(img.color) === normalize(item.color);
  });

  return resolveMediaUrl(selected?.photo || item.clothes.clothes_img[0]?.photo) || "/fallback-image.png";
};

const OrderStatusModal = ({ isOpen, inClose, order_status }: OrderStatusModalProps) => {
  if (!isOpen) return null;

  const normalizedStatus = normalizeOrderStatus(order_status.order_status);
  const currentIndex = WORKFLOW.indexOf(normalizedStatus);
  const orderDisplayNumber = order_status.order_number || (order_status.id ? `#${order_status.id}` : `#${order_status.cart.user}`);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Статус заказа</h3>
          <button type="button" onClick={inClose} aria-label="Закрыть">
            &times;
          </button>
        </div>

        <div className={styles.statusTimeline}>
          {TIMELINE_ITEMS.map((item, index) => {
            const isActive = normalizedStatus === item.status;
            const isCompleted = currentIndex >= index && currentIndex >= 0;

            return (
              <div
                key={item.status}
                className={`${styles.timelineItem} ${isActive ? styles.active : isCompleted ? styles.active : ""}`}
              >
                <div className={styles.icon}>{item.icon}</div>
                <p>{item.label}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.orderInfo}>
          <p>{STATUS_MESSAGES[normalizedStatus]}</p>

          <div className={styles.orderDetails}>
            <div>
              <span>Дата заказа</span>
              <p>{formatDate(order_status.date)}</p>
            </div>
            <div>
              <span>Всего</span>
              <p>{formatSom(order_status.cart.total_price)}</p>
            </div>
            <div>
              <span>Номер заказа</span>
              <p>{orderDisplayNumber}</p>
            </div>
          </div>

          <div className={styles.orderItems}>
            {order_status.cart.cart_items.map((item, idx) => (
              <div key={`${orderDisplayNumber}-${idx}`} className={styles.item}>
                <Image src={resolveOrderItemImage(item)} alt={item.clothes.clothes_name || "Товар"} width={100} height={120} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusModal;
