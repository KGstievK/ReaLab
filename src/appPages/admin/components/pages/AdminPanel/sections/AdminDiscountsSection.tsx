"use client";

import scss from "../AdminPanel.module.scss";
import {
  formatMoney,
  getEffectiveProductPrice,
} from "../AdminPanel.shared";

type DiscountSummary = {
  total_products: number;
  discounted_products: number;
  risky_products: number;
  average_discount_percent: number;
};

type AdminDiscountsSectionProps = {
  filteredProducts: AdminProduct[];
  canManageDiscounts: boolean;
  discountSummary: DiscountSummary;
  discountDrafts: Record<number, string>;
  discountSavingId: number | null;
  onDiscountDraftChange: (productId: number, value: string) => void;
  onApplyDiscountPreset: (product: AdminProduct, percent: number) => void;
  onResetDiscountDraft: (productId: number) => void;
  onSaveDiscount: (product: AdminProduct) => Promise<void>;
};

export const AdminDiscountsSection = ({
  filteredProducts,
  canManageDiscounts,
  discountSummary,
  discountDrafts,
  discountSavingId,
  onDiscountDraftChange,
  onApplyDiscountPreset,
  onResetDiscountDraft,
  onSaveDiscount,
}: AdminDiscountsSectionProps) => (
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

    <div className={scss.discountSummary}>
      <article>
        <span>Всего товаров</span>
        <strong>{discountSummary.total_products}</strong>
      </article>
      <article>
        <span>Со скидкой</span>
        <strong>{discountSummary.discounted_products}</strong>
      </article>
      <article>
        <span>Средняя скидка</span>
        <strong>{discountSummary.average_discount_percent}%</strong>
      </article>
      <article>
        <span>Ниже себестоимости</span>
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
  </div>
);
