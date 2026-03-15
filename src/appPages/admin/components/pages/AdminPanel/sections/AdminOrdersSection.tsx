"use client";

import { useEffect, useState } from "react";
import scss from "../AdminPanel.module.scss";
import {
  DELIVERY_METHOD_LABELS,
  formatDate,
  formatMoney,
  getNextOrderStatus,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "../AdminPanel.shared";

type AdminOrdersSectionProps = {
  filteredOrders: AdminOrder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  search: string;
  externalRefFilter: string;
  ordering: "newest" | "oldest" | "total_desc" | "total_asc" | "payment_status";
  statusFilter: AdminOrderStatus | "all";
  paymentStatusFilter: AdminPaymentStatus | "all";
  deliveryMethodFilter: AdminDeliveryMethod | "all";
  dateFrom: string;
  dateTo: string;
  canManageOrders: boolean;
  isUpdatingOrderStatus: boolean;
  onSearchChange: (value: string) => void;
  onExternalRefFilterChange: (value: string) => void;
  onOrderingChange: (value: "newest" | "oldest" | "total_desc" | "total_asc" | "payment_status") => void;
  onStatusFilterChange: (value: AdminOrderStatus | "all") => void;
  onPaymentStatusFilterChange: (value: AdminPaymentStatus | "all") => void;
  onDeliveryMethodFilterChange: (value: AdminDeliveryMethod | "all") => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOpenOrderDetails: (order: AdminOrder) => void;
  onChangeOrderStatus: (id: number, status: AdminOrderStatus) => Promise<void>;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const ORDERING_LABELS = {
  newest: "Сначала новые",
  oldest: "Сначала старые",
  total_desc: "Сумма: по убыванию",
  total_asc: "Сумма: по возрастанию",
  payment_status: "По статусу оплаты",
} as const;

export const AdminOrdersSection = ({
  filteredOrders,
  totalCount,
  currentPage,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  search,
  externalRefFilter,
  ordering,
  statusFilter,
  paymentStatusFilter,
  deliveryMethodFilter,
  dateFrom,
  dateTo,
  canManageOrders,
  isUpdatingOrderStatus,
  onSearchChange,
  onExternalRefFilterChange,
  onOrderingChange,
  onStatusFilterChange,
  onPaymentStatusFilterChange,
  onDeliveryMethodFilterChange,
  onDateFromChange,
  onDateToChange,
  onResetFilters,
  onPageChange,
  onPageSizeChange,
  onOpenOrderDetails,
  onChangeOrderStatus,
}: AdminOrdersSectionProps) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);
  const [pageJumpValue, setPageJumpValue] = useState(String(currentPage));

  useEffect(() => {
    setPageJumpValue(String(currentPage));
  }, [currentPage]);

  const handlePageJump = () => {
    const parsed = Number(pageJumpValue);
    if (!Number.isFinite(parsed)) {
      setPageJumpValue(String(currentPage));
      return;
    }

    const nextPage = Math.min(totalPages, Math.max(1, Math.trunc(parsed)));
    if (nextPage !== currentPage) {
      onPageChange(nextPage);
    }
    setPageJumpValue(String(nextPage));
  };

  return (
    <div className={scss.panel}>
      <div className={scss.panelHead}>
        <div>
          <h2>Заказы</h2>
          <p className={scss.panelNote}>
            Показано <strong>{rangeStart}-{rangeEnd}</strong> из <strong>{totalCount}</strong>
          </p>
        </div>
      </div>

      <div className={scss.orderFilters}>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по номеру, клиенту или телефону"
        />
        <input
          value={externalRefFilter}
          onChange={(event) => onExternalRefFilterChange(event.target.value)}
          placeholder="Код оплаты / external_ref"
        />
        <select
          value={ordering}
          onChange={(event) =>
            onOrderingChange(
              event.target.value as "newest" | "oldest" | "total_desc" | "total_asc" | "payment_status",
            )
          }
        >
          {Object.entries(ORDERING_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as AdminOrderStatus | "all")}
        >
          <option value="all">Все статусы заказа</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(event) =>
            onPaymentStatusFilterChange(event.target.value as AdminPaymentStatus | "all")
          }
        >
          <option value="all">Все статусы оплаты</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={deliveryMethodFilter}
          onChange={(event) =>
            onDeliveryMethodFilterChange(event.target.value as AdminDeliveryMethod | "all")
          }
        >
          <option value="all">Все способы доставки</option>
          {Object.entries(DELIVERY_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} />
        <input type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} />
        <button type="button" className={scss.secondaryAction} onClick={onResetFilters}>
          Сбросить фильтры
        </button>
      </div>

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

      <div className={scss.auditPager}>
        <span>
          Страница {currentPage} из {totalPages}
        </span>
        <div className={scss.orderPagerControls}>
          <label className={scss.pageSizeControl}>
            <span>Показывать</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className={scss.pageJump}>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageJumpValue}
              onChange={(event) => setPageJumpValue(event.target.value)}
              onBlur={handlePageJump}
            />
            <button type="button" className={scss.secondaryAction} onClick={handlePageJump}>
              Перейти
            </button>
          </div>
          <div className={scss.auditPagerActions}>
            <button
              type="button"
              className={scss.secondaryAction}
              disabled={!hasPreviousPage}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Назад
            </button>
            <button
              type="button"
              className={scss.secondaryAction}
              disabled={!hasNextPage}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Далее
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
