"use client";

import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import scss from "../AdminPanel.module.scss";

type AdminProductsSectionProps = {
  filteredProducts: AdminProduct[];
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  onCreateProduct: () => void;
  onEditProduct: (product: AdminProduct) => void;
  onDeleteProduct: (product: AdminProduct) => void;
};

export const AdminProductsSection = ({
  filteredProducts,
  canManageProducts,
  canDeleteProducts,
  onCreateProduct,
  onEditProduct,
  onDeleteProduct,
}: AdminProductsSectionProps) => (
  <div className={scss.panel}>
    <div className={scss.panelHead}>
      <h2>Товары</h2>
      <button type="button" onClick={onCreateProduct} disabled={!canManageProducts}>
        <FiPlus />
        Добавить
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
          {filteredProducts.length ? (
            filteredProducts.map((item) => (
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
  </div>
);
