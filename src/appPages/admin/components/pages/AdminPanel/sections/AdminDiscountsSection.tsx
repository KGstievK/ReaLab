"use client";

import { useEffect, useState } from "react";
import scss from "../AdminPanel.module.scss";
import { formatMoney, getEffectiveProductPrice } from "../AdminPanel.shared";

type DiscountSummary = {
  total_products: number;
  discounted_products: number;
  risky_products: number;
  average_discount_percent: number;
};

type AdminDiscountsSectionProps = {
  filteredProducts: AdminProduct[];
  categories: AdminCategory[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  search: string;
  sorting: "name" | "-name" | "created_at" | "-created_at" | "updated_at" | "-updated_at";
  categoryFilter: number | "all";
  activeFilter: "all" | "active" | "draft";
  canManageDiscounts: boolean;
  discountSummary: DiscountSummary;
  discountDrafts: Record<number, string>;
  discountSavingId: number | null;
  onSearchChange: (value: string) => void;
  onSortChange: (
    value: "name" | "-name" | "created_at" | "-created_at" | "updated_at" | "-updated_at",
  ) => void;
  onCategoryFilterChange: (value: number | "all") => void;
  onActiveFilterChange: (value: "all" | "active" | "draft") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onResetFilters: () => void;
  onDiscountDraftChange: (productId: number, value: string) => void;
  onApplyDiscountPreset: (product: AdminProduct, percent: number) => void;
  onResetDiscountDraft: (productId: number) => void;
  onSaveDiscount: (product: AdminProduct) => Promise<void>;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const PRODUCT_SORT_LABELS = {
  "-updated_at": "Недавно изменённые",
  "-created_at": "Сначала новые",
  created_at: "Сначала старые",
  name: "Название: А-Я",
  "-name": "Название: Я-А",
  updated_at: "Давно не изменялись",
} as const;

export const AdminDiscountsSection = ({
  filteredProducts,
  categories,
  totalCount,
  currentPage,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  search,
  sorting,
  categoryFilter,
  activeFilter,
  canManageDiscounts,
  discountSummary,
  discountDrafts,
  discountSavingId,
  onSearchChange,
  onSortChange,
  onCategoryFilterChange,
  onActiveFilterChange,
  onPageChange,
  onPageSizeChange,
  onResetFilters,
  onDiscountDraftChange,
  onApplyDiscountPreset,
  onResetDiscountDraft,
  onSaveDiscount,
}: AdminDiscountsSectionProps) => {
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
          <h2>Скидки</h2>
          <p className={scss.panelNote}>
            Управляйте скидками отдельно от остального каталога и сразу видьте маржу
            относительно себестоимости.
          </p>
        </div>
      </div>

      <div className={scss.productFilters}>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по названию или slug"
        />
        <select
          value={sorting}
          onChange={(event) =>
            onSortChange(
              event.target.value as
                | "name"
                | "-name"
                | "created_at"
                | "-created_at"
                | "updated_at"
                | "-updated_at",
            )
          }
        >
          {Object.entries(PRODUCT_SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(event) =>
            onCategoryFilterChange(
              event.target.value === "all" ? "all" : Number(event.target.value),
            )
          }
        >
          <option value="all">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.category_name}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(event) => onActiveFilterChange(event.target.value as "all" | "active" | "draft")}
        >
          <option value="all">Все статусы</option>
          <option value="active">Только активные</option>
          <option value="draft">Только черновики</option>
        </select>
        <button type="button" className={scss.secondaryAction} onClick={onResetFilters}>
          Сбросить фильтры
        </button>
      </div>

      <div className={scss.discountSummary}>
        <article>
          <span>Товаров в выборке</span>
          <strong>{totalCount}</strong>
        </article>
        <article>
          <span>Со скидкой на странице</span>
          <strong>{discountSummary.discounted_products}</strong>
        </article>
        <article>
          <span>Средняя скидка на странице</span>
          <strong>{discountSummary.average_discount_percent}%</strong>
        </article>
        <article>
          <span>Ниже себестоимости на странице</span>
          <strong>{discountSummary.risky_products}</strong>
        </article>
      </div>

      <div className={scss.tableWrap}>
        <table className={scss.discountTable}>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Категория</th>
              <th>Базовая цена</th>
              <th>Себестоимость</th>
              <th>Текущая цена</th>
              <th>Скидка</th>
              <th>Маржа</th>
              <th>Управление</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length ? (
              filteredProducts.map((item) => {
                const effectivePrice = getEffectiveProductPrice(item);
                const margin = Number((effectivePrice - item.cost_price).toFixed(2));

                return (
                  <tr key={item.id}>
                    <td>
                      <div className={scss.discountProduct}>
                        <strong>{item.name}</strong>
                        <span>#{item.id}</span>
                      </div>
                    </td>
                    <td>{item.category_name}</td>
                    <td>{formatMoney(item.base_price)}</td>
                    <td>{formatMoney(item.cost_price)}</td>
                    <td>{formatMoney(effectivePrice)}</td>
                    <td>
                      <div className={scss.discountCell}>
                        <input
                          type="number"
                          min={0}
                          value={discountDrafts[item.id] ?? ""}
                          onChange={(event) =>
                            onDiscountDraftChange(item.id, event.target.value)
                          }
                          placeholder="Без скидки"
                          disabled={!canManageDiscounts}
                        />
                        <div className={scss.discountPresets}>
                          {[5, 10, 15, 20, 30].map((percent) => (
                            <button
                              key={`${item.id}-${percent}`}
                              type="button"
                              className={scss.presetButton}
                              onClick={() => onApplyDiscountPreset(item, percent)}
                              disabled={!canManageDiscounts}
                            >
                              -{percent}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        className={`${scss.marginValue} ${
                          margin < 0 ? scss.negativeValue : scss.positiveValue
                        }`}
                      >
                        {formatMoney(margin)}
                      </div>
                    </td>
                    <td>
                      <div className={scss.rowActions}>
                        <button
                          type="button"
                          className={scss.secondaryAction}
                          onClick={() => onResetDiscountDraft(item.id)}
                          disabled={!canManageDiscounts}
                        >
                          Сбросить
                        </button>
                        <button
                          type="button"
                          className={scss.action}
                          onClick={() => void onSaveDiscount(item)}
                          disabled={!canManageDiscounts || discountSavingId === item.id}
                        >
                          {discountSavingId === item.id ? "Сохранение..." : "Сохранить"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8}>Товары не найдены.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={scss.auditPager}>
        <span>
          Показано {rangeStart}-{rangeEnd} из {totalCount}. Страница {currentPage} из {totalPages}
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
