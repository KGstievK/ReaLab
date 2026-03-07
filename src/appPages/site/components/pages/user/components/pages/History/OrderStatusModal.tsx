"use client";

import React from "react";
import styles from "./OrderStatusModal.module.scss";
import Image from "next/image";
import { GrBasket } from "react-icons/gr";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { TbTruckDelivery } from "react-icons/tb";
import { FaBoxOpen } from "react-icons/fa6";

type OrderStatus = string;

interface CartItem {
  clothes: {
    clothes_img: Array<{
      id: number;
      photo: string;
    }>;
  };
  color: number;
}

interface Cart {
  total_price: string;
  user: number;
  cart_items: CartItem[];
}

interface IOrder {
  order_status: OrderStatus;
  date: string;
  cart: Cart;
}

interface OrderStatusModalProps {
  isOpen: boolean;
  inClose: () => void;
  order_status: IOrder;
}

const normalizeStatus = (status: string) => status.trim().toLowerCase();

const OrderStatusModal = ({
  isOpen,
  inClose,
  order_status,
}: OrderStatusModalProps) => {
  if (!isOpen) return null;

  const getTimelineStatus = (
    currentStatus: OrderStatus,
    itemStatus: OrderStatus
  ): boolean => {
    if (normalizeStatus(currentStatus) === "отменен") {
      return normalizeStatus(itemStatus) === "отменен";
    }

    const statusOrder: Record<string, number> = {
      обработка: 1,
      "заказ собирается": 2,
      "в процессе доставки": 3,
      доставлен: 4,
      отменен: 0,
    };

    return (
      (statusOrder[normalizeStatus(currentStatus)] ?? 0) >=
      (statusOrder[normalizeStatus(itemStatus)] ?? 0)
    );
  };

  const timelineItems = [
    { icon: <FaBoxOpen />, status: "Отменен" as OrderStatus, text: "Отменен" },
    {
      icon: <GrBasket />,
      status: "Обработка" as OrderStatus,
      text: "Заказ размещен",
    },
    {
      icon: <HiOutlineArrowPath />,
      status: "заказ собирается" as OrderStatus,
      text: "Собирается",
    },
    {
      icon: <TbTruckDelivery />,
      status: "в процессе доставки" as OrderStatus,
      text: "В пути",
    },
    {
      icon: <FaBoxOpen />,
      status: "Доставлен" as OrderStatus,
      text: "Доставлен",
    },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Статус заказа</h3>
          <button onClick={inClose}>&times;</button>
        </div>

        <div className={styles.statusTimeline}>
          {timelineItems.map((item, index) => (
            <div
              key={index}
              className={`${styles.timelineItem} ${
                getTimelineStatus(order_status.order_status, item.status)
                  ? styles.active
                  : ""
              }`}
            >
              <div className={styles.icon}>{item.icon}</div>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        <div className={styles.orderInfo}>
          <p>
            {order_status.order_status === "Обработка"
              ? "Ваш заказ обрабатывается."
              : order_status.order_status === "заказ собирается"
              ? "Ваш заказ собирается."
              : order_status.order_status === "в процессе доставки"
              ? "Ваш заказ в пути."
              : order_status.order_status === "Доставлен"
              ? "Ваш заказ доставлен."
              : order_status.order_status === "Отменен"
              ? "Ваш заказ отменен."
              : "Статус заказа обновляется."}
          </p>
          <div className={styles.orderDetails}>
            <div>
              <span>Дата заказа</span>
              <p>{order_status.date}</p>
            </div>
            <div>
              <span>Всего</span>
              <p>{order_status.cart.total_price} c</p>
            </div>
            <div>
              <span>Номер заказа</span>
              <p>#{order_status.cart.user}</p>
            </div>
          </div>
          <div className={styles.orderItems}>
            {order_status.cart.cart_items.map((item, idx) => {
              const selectedImage = item.clothes.clothes_img.find(
                (img) => img.id === item.color
              );

              return (
                <div key={idx} className={styles.item}>
                  <Image
                    src={selectedImage?.photo || "/fallback-image.png"}
                    alt="Product"
                    width={100}
                    height={120}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusModal;
