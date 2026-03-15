"use client";

import scss from "../AdminPanel.module.scss";
import { formatDate } from "../AdminPanel.shared";

const MOVEMENT_LABELS: Record<AdminInventoryMovement["type"], string> = {
  initial: "Инициализация",
  manual_adjustment: "Ручная корректировка",
  order_reserved: "Резерв заказа",
  order_released: "Возврат на склад",
};

type AdminInventorySectionProps = {
  inventory: AdminPaginatedResponse<AdminInventoryRecord>;
  movements: AdminPaginatedResponse<AdminInventoryMovement>;
  lowStockOnly: boolean;
  selectedMovementType: AdminInventoryMovement["type"] | "all";
  selectedInventoryItem: Pick<
    AdminInventoryRecord,
    "product_id" | "variant_id" | "product_name" | "sku" | "size" | "color"
  > | null;
  onToggleLowStock: () => void;
  onSelectMovementType: (value: AdminInventoryMovement["type"] | "all") => void;
  onSelectInventoryItem: (
    value: Pick<
      AdminInventoryRecord,
      "product_id" | "variant_id" | "product_name" | "sku" | "size" | "color"
    >,
  ) => void;
  onClearMovementFilters: () => void;
};

export const AdminInventorySection = ({
  inventory,
  movements,
  lowStockOnly,
  selectedMovementType,
  selectedInventoryItem,
  onToggleLowStock,
  onSelectMovementType,
  onSelectInventoryItem,
  onClearMovementFilters,
}: AdminInventorySectionProps) => {
  const lowStockCount = inventory.results.filter((item) => item.is_low_stock).length;
  const totalQuantity = inventory.results.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={scss.panel}>
      <div className={scss.panelHead}>
        <div>
          <h2>Склад по SKU</h2>
          <p className={scss.panelNote}>
            Реальные остатки и движения по вариантам товара поверх inventory bridge.
          </p>
        </div>
        <button
          type="button"
          className={lowStockOnly ? undefined : scss.secondaryAction}
          onClick={onToggleLowStock}
        >
          {lowStockOnly ? "Показать все SKU" : "Только низкий остаток"}
        </button>
      </div>

      <div className={scss.inventoryStats}>
        <article>
          <span>SKU в выдаче</span>
          <strong>{inventory.results.length}</strong>
        </article>
        <article>
          <span>Низкий остаток</span>
          <strong>{lowStockCount}</strong>
        </article>
        <article>
          <span>Суммарный остаток</span>
          <strong>{totalQuantity}</strong>
        </article>
      </div>

      <div className={scss.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Товар</th>
              <th>Вариант</th>
              <th>Остаток</th>
              <th>Порог</th>
              <th>Статус</th>
              <th>Обновлено</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {inventory.results.length ? (
              inventory.results.map((item) => (
                <tr key={item.id}>
                  <td>{item.sku}</td>
                  <td>
                    <div className={scss.inventoryProduct}>
                      <strong>{item.product_name}</strong>
                      <span>{item.category_name}</span>
                    </div>
                  </td>
                  <td>{`${item.color} / ${item.size}`}</td>
                  <td>{item.quantity}</td>
                  <td>{item.min_stock}</td>
                  <td>
                    <span className={`${scss.tag} ${item.is_low_stock ? scss.tagDanger : scss.tagSuccess}`}>
                      {item.is_low_stock ? "Низкий остаток" : item.is_active ? "В норме" : "Неактивен"}
                    </span>
                  </td>
                  <td>{formatDate(item.updated_at)}</td>
                  <td>
                    <button
                      type="button"
                      className={scss.secondaryAction}
                      onClick={() =>
                        onSelectInventoryItem({
                          product_id: item.product_id,
                          variant_id: item.variant_id,
                          product_name: item.product_name,
                          sku: item.sku,
                          size: item.size,
                          color: item.color,
                        })
                      }
                    >
                      Движения
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>Данные по складу не найдены.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={scss.panelHead}>
        <div>
          <h3>Последние движения</h3>
          <p className={scss.panelNote}>Последние изменения остатков по заказам и ручным корректировкам.</p>
        </div>
      </div>

      <div className={scss.inventoryFilters}>
        <select
          value={selectedMovementType}
          onChange={(event) =>
            onSelectMovementType(event.target.value as AdminInventoryMovement["type"] | "all")
          }
        >
          <option value="all">Все типы движений</option>
          {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {selectedInventoryItem ? (
          <div className={scss.inventorySelection}>
            <span>
              Фильтр по SKU: <strong>{selectedInventoryItem.sku}</strong> ·{" "}
              {selectedInventoryItem.product_name} · {selectedInventoryItem.color} / {selectedInventoryItem.size}
            </span>
            <button type="button" className={scss.secondaryAction} onClick={onClearMovementFilters}>
              Сбросить
            </button>
          </div>
        ) : (
          <span className={scss.inventoryHint}>
            Выберите SKU в таблице выше, чтобы посмотреть только его движения.
          </span>
        )}
      </div>

      <div className={scss.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>SKU</th>
              <th>Тип</th>
              <th>Изменение</th>
              <th>Баланс</th>
              <th>Заказ</th>
              <th>Примечание</th>
            </tr>
          </thead>
          <tbody>
            {movements.results.length ? (
              movements.results.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{item.sku}</td>
                  <td>{MOVEMENT_LABELS[item.type]}</td>
                  <td>{item.quantity_delta > 0 ? `+${item.quantity_delta}` : item.quantity_delta}</td>
                  <td>{item.balance_after}</td>
                  <td>{item.order_number || "—"}</td>
                  <td>{item.note || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>Движения по складу не найдены.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
