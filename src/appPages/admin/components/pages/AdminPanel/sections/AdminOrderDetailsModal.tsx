"use client";

import { FiX } from "react-icons/fi";
import { resolveMediaUrl } from "../../../../../../utils/media";
import scss from "../AdminPanel.module.scss";
import {
  DELIVERY_METHOD_LABELS,
  formatDate,
  formatMoney,
  normalizeWorkflowStatus,
  ORDER_WORKFLOW,
  PAYMENT_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "../AdminPanel.shared";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mbank_redirect: "MBank",
  finca_qr: "FINCA Bank",
  manual: "Ручная обработка",
};

const formatPaymentMethod = (method?: string | null, provider?: string | null) => {
  if (method && PAYMENT_METHOD_LABELS[method]) {
    return PAYMENT_METHOD_LABELS[method];
  }

  if (provider) {
    return provider;
  }

  return "-";
};

type AdminOrderDetailsModalProps = {
  selectedOrder: AdminOrder | null;
  canManageOrders: boolean;
  isUpdatingOrderStatus: boolean;
  onClose: () => void;
  onChangeOrderStatus: (id: number, status: AdminOrderStatus) => Promise<void>;
};

export const AdminOrderDetailsModal = ({
  selectedOrder,
  canManageOrders,
  isUpdatingOrderStatus,
  onClose,
  onChangeOrderStatus,
}: AdminOrderDetailsModalProps) => {
  if (!selectedOrder) {
    return null;
  }

  const deliveryAddress = selectedOrder.shipping_address ?? {
    city: selectedOrder.city,
    address: selectedOrder.address,
  };

  return (
    <div
      className={scss.modalOverlay}
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className={`${scss.modal} ${scss.orderModal}`}>
        <div className={scss.modalHeader}>
          <div className={scss.orderModalHeader}>
            <p>Детали заказа</p>
            <h3>{selectedOrder.order_number}</h3>
          </div>
          <button
            type="button"
            className={scss.closeButton}
            onClick={onClose}
            aria-label="Закрыть детали заказа"
          >
            <FiX />
          </button>
        </div>

        <div className={scss.modalBody}>
          <div className={scss.orderDetailsGrid}>
            <article className={scss.orderDetailCard}>
              <h4>Клиент</h4>
              <dl className={scss.orderMetaList}>
                <div>
                  <dt>Имя</dt>
                  <dd>{selectedOrder.customer_name}</dd>
                </div>
                <div>
                  <dt>Телефон</dt>
                  <dd>{selectedOrder.customer_phone}</dd>
                </div>
                <div>
                  <dt>ID клиента</dt>
                  <dd>#{selectedOrder.customer_id}</dd>
                </div>
              </dl>
            </article>

            <article className={scss.orderDetailCard}>
              <h4>Статус и доставка</h4>
              <dl className={scss.orderMetaList}>
                <div>
                  <dt>Статус заказа</dt>
                  <dd>{STATUS_LABELS[selectedOrder.status]}</dd>
                </div>
                <div>
                  <dt>Оплата</dt>
                  <dd>{PAYMENT_STATUS_LABELS[selectedOrder.payment_status]}</dd>
                </div>
                <div>
                  <dt>Способ доставки</dt>
                  <dd>{DELIVERY_METHOD_LABELS[selectedOrder.delivery_method]}</dd>
                </div>
                <div>
                  <dt>Создан</dt>
                  <dd>{formatDate(selectedOrder.created_at)}</dd>
                </div>
                <div>
                  <dt>Обновлен</dt>
                  <dd>{formatDate(selectedOrder.updated_at)}</dd>
                </div>
              </dl>
            </article>

            <article className={scss.orderDetailCard}>
              <div className={scss.orderSectionHead}>
                <h4>Управление статусом</h4>
                <span>{STATUS_LABELS[normalizeWorkflowStatus(selectedOrder.status)]}</span>
              </div>

              {selectedOrder.status === "cancelled" || selectedOrder.status === "returned" ? (
                <p className={scss.statusHint}>
                  Для отмененных и возвращенных заказов поэтапный переход отключен.
                </p>
              ) : (
                <>
                  <div className={scss.statusFlow}>
                    {ORDER_WORKFLOW.map((status, index) => {
                      const currentIndex = ORDER_WORKFLOW.indexOf(
                        normalizeWorkflowStatus(selectedOrder.status),
                      );
                      const isActive = normalizeWorkflowStatus(selectedOrder.status) === status;
                      const isCompleted = currentIndex > index;
                      const isNext = currentIndex + 1 === index;

                      return (
                        <button
                          key={status}
                          type="button"
                          className={`${scss.statusStep} ${
                            isActive
                              ? scss.statusStepActive
                              : isCompleted
                                ? scss.statusStepCompleted
                                : ""
                          }`}
                          disabled={!canManageOrders || !isNext || isUpdatingOrderStatus}
                          onClick={() => void onChangeOrderStatus(selectedOrder.id, status)}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      );
                    })}
                  </div>
                  <p className={scss.statusHint}>
                    Доступен только следующий этап: размещен → собирается → в пути → доставлен.
                  </p>
                </>
              )}
            </article>

            {selectedOrder.payment && (
              <article className={scss.orderDetailCard}>
                <h4>Платеж</h4>
                <dl className={scss.orderMetaList}>
                  <div>
                    <dt>Статус</dt>
                    <dd>{PAYMENT_STATUS_LABELS[selectedOrder.payment.status]}</dd>
                  </div>
                  <div>
                    <dt>Метод</dt>
                    <dd>
                      {formatPaymentMethod(
                        selectedOrder.payment.method,
                        selectedOrder.payment.provider,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Провайдер</dt>
                    <dd>{selectedOrder.payment.provider || "-"}</dd>
                  </div>
                  <div>
                    <dt>Сумма</dt>
                    <dd>{formatMoney(selectedOrder.payment.amount)}</dd>
                  </div>
                  <div className={scss.orderMetaWide}>
                    <dt>Код сессии / внешний ref</dt>
                    <dd>{selectedOrder.payment.external_ref || "-"}</dd>
                  </div>
                </dl>
              </article>
            )}

            {selectedOrder.shipment && (
              <article className={scss.orderDetailCard}>
                <h4>Отгрузка</h4>
                <dl className={scss.orderMetaList}>
                  <div>
                    <dt>Статус</dt>
                    <dd>{SHIPMENT_STATUS_LABELS[selectedOrder.shipment.status] || selectedOrder.shipment.status}</dd>
                  </div>
                  <div>
                    <dt>Тариф</dt>
                    <dd>{formatMoney(selectedOrder.shipment.price)}</dd>
                  </div>
                  <div>
                    <dt>Служба</dt>
                    <dd>{selectedOrder.shipment.service_name || selectedOrder.shipment.carrier || "-"}</dd>
                  </div>
                  <div>
                    <dt>Трек-номер</dt>
                    <dd>{selectedOrder.shipment.tracking_number || "-"}</dd>
                  </div>
                </dl>
              </article>
            )}

            {selectedOrder.delivery_method === "courier" && deliveryAddress.address.trim() && (
              <article className={scss.orderDetailCard}>
                <h4>Адрес доставки</h4>
                <dl className={scss.orderMetaList}>
                  <div>
                    <dt>Город</dt>
                    <dd>{deliveryAddress.city || "-"}</dd>
                  </div>
                  <div className={scss.orderMetaWide}>
                    <dt>Адрес</dt>
                    <dd>{deliveryAddress.address}</dd>
                  </div>
                </dl>
              </article>
            )}
          </div>

          <article className={scss.orderDetailCard}>
            <div className={scss.orderSectionHead}>
              <h4>Состав заказа</h4>
              <span>{selectedOrder.items.length} товаров</span>
            </div>

            <div className={scss.orderItemsList}>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={`${selectedOrder.id}-${item.product_id}-${index}`}
                  className={scss.orderItemRow}
                >
                  <div className={scss.orderItemPreview}>
                    {item.image_url ? (
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt={item.color || item.product_name}
                      />
                    ) : (
                      <div className={scss.orderItemPlaceholder}>Нет фото</div>
                    )}
                  </div>
                  <div className={scss.orderItemInfo}>
                    <strong>{item.product_name}</strong>
                    <span>Цвет: {item.color || "-"}</span>
                    <span>Размер: {item.size || "-"}</span>
                  </div>
                  <div className={scss.orderItemMeta}>
                    <span>{item.quantity} шт.</span>
                    <span>{formatMoney(item.unit_price)}</span>
                    <strong>{formatMoney(item.total_price)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={scss.orderDetailCard}>
            <h4>Итоги</h4>
            <ul className={scss.orderTotals}>
              <li>
                <span>Товары</span>
                <strong>{formatMoney(selectedOrder.subtotal)}</strong>
              </li>
              <li>
                <span>Доставка</span>
                <strong>{formatMoney(selectedOrder.delivery_price)}</strong>
              </li>
              <li>
                <span>Скидка</span>
                <strong>{formatMoney(selectedOrder.discount_amount)}</strong>
              </li>
              <li className={scss.orderTotalFinal}>
                <span>Итого к оплате</span>
                <strong>{formatMoney(selectedOrder.total_amount)}</strong>
              </li>
            </ul>
          </article>
        </div>

        <div className={scss.modalActions}>
          <button
            type="button"
            className={scss.secondary}
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
