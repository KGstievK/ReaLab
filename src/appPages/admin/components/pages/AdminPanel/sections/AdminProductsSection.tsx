"use client";

import { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import scss from "../AdminPanel.module.scss";

type AdminProductsSectionProps = {
  products: AdminProduct[];
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
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (
    value: "name" | "-name" | "created_at" | "-created_at" | "updated_at" | "-updated_at",
  ) => void;
  onCategoryFilterChange: (value: number | "all") => void;
  onActiveFilterChange: (value: "all" | "active" | "draft") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onResetFilters: () => void;
  onCreateProduct: () => void;
  onEditProduct: (product: AdminProduct) => void;
  onDeleteProduct: (product: AdminProduct) => void;
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

export const AdminProductsSection = ({
  products,
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
  canManageProducts,
  canDeleteProducts,
  onSearchChange,
  onSortChange,
  onCategoryFilterChange,
  onActiveFilterChange,
  onPageChange,
  onPageSizeChange,
  onResetFilters,
  onCreateProduct,
  onEditProduct,
  onDeleteProduct,
}: AdminProductsSectionProps) => {
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
          <h2>Товары</h2>
          <p className={scss.panelNote}>
            Показано <strong>{rangeStart}-{rangeEnd}</strong> из <strong>{totalCount}</strong>
          </p>
        </div>
        <button type="button" onClick={onCreateProduct} disabled={!canManageProducts}>
          <FiPlus />
          Добавить
        </button>
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

      <div className={scss.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Остаток</th>
              <th>Продано</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.length ? (
              products.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category_name}</td>
                  <td>{item.total_stock}</td>
                  <td>{item.sold_items}</td>
                  <td>{item.active ? "Активен" : "Черновик"}</td>
                  <td>
                    <div className={scss.rowActions}>
                      <button
                        type="button"
                        className={scss.iconButton}
                        onClick={() => onEditProduct(item)}
                        aria-label={`Редактировать ${item.name}`}
                        disabled={!canManageProducts}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className={`${scss.iconButton} ${scss.dangerIcon}`}
                        onClick={() => onDeleteProduct(item)}
                        aria-label={`Удалить ${item.name}`}
                        disabled={!canDeleteProducts}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>Товары не найдены.</td>
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
