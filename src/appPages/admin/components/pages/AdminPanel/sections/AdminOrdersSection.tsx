"use client";

import scss from "../AdminPanel.module.scss";
import {
  formatDate,
  formatMoney,
  getNextOrderStatus,
  STATUS_LABELS,
} from "../AdminPanel.shared";

type AdminOrdersSectionProps = {
  filteredOrders: AdminOrder[];
  canManageOrders: boolean;
  isUpdatingOrderStatus: boolean;
  onOpenOrderDetails: (order: AdminOrder) => void;
  onChangeOrderStatus: (id: number, status: AdminOrderStatus) => Promise<void>;
};

export const AdminOrdersSection = ({
  filteredOrders,
  canManageOrders,
  isUpdatingOrderStatus,
  onOpenOrderDetails,
  onChangeOrderStatus,
}: AdminOrdersSectionProps) => (
  <div className={scss.panel}>
    <h2>Заказы</h2>
    <div className={scss.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Номер</th>
            <th>Клиент</th>
            <th>Дата</th>
            <th>Статус</th>
            <th>Сумма</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length ? (
            filteredOrders.map((item) => (
              <tr
                key={item.id}
                className={scss.clickableRow}
                onClick={() => onOpenOrderDetails(item)}
              >
                <td>{item.order_number}</td>
                <td>{item.customer_name}</td>
                <td>{formatDate(item.created_at)}</td>
                <td>{STATUS_LABELS[item.status]}</td>
                <td>{formatMoney(item.total_amount)}</td>
                <td>
                  <div className={scss.rowActions}>
                    <button
                      type="button"
                      className={scss.secondaryAction}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenOrderDetails(item);
                      }}
                    >
                      Подробнее
                    </button>
                    {(() => {
                      const nextStatus = getNextOrderStatus(item.status);
                      if (!nextStatus) {
                        return <span>Готово</span>;
                      }

                      return (
                        <button
                          type="button"
                          className={scss.action}
                          disabled={!canManageOrders || isUpdatingOrderStatus}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onChangeOrderStatus(item.id, nextStatus);
                          }}
                        >
                          {STATUS_LABELS[nextStatus]}
                        </button>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>Заказы не найдены.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
