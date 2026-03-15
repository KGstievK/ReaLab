"use client";

import scss from "../AdminPanel.module.scss";
import { formatDate, formatMoney } from "../AdminPanel.shared";

type AdminDashboardSectionProps = {
  dashboard: AdminDashboardOverview;
  financeSummary: AdminFinanceSummary;
  maxRevenue: number;
};

export const AdminDashboardSection = ({
  dashboard,
  financeSummary,
  maxRevenue,
}: AdminDashboardSectionProps) => {
  const hasData = dashboard.kpis.length > 0 || dashboard.revenue_series.length > 0;

  if (!hasData) {
    return (
      <div className={scss.panel}>
        <div className={scss.statePanel}>
          <h2>Аналитика</h2>
          <p>Данных для выбранного периода пока нет.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={scss.dashboard}>
      <div className={scss.kpis}>
        {dashboard.kpis.map((kpi) => (
          <article key={kpi.id}>
            <span>{kpi.label}</span>
            <h3>{kpi.id === "revenue" ? formatMoney(kpi.value) : kpi.value}</h3>
            <p>
              {kpi.delta_percent > 0 ? "+" : ""}
              {kpi.delta_percent}%
            </p>
          </article>
        ))}
      </div>

      <div className={scss.gridTwo}>
        <article className={scss.card}>
          <h3>Доход по дням</h3>
          <div className={scss.chart}>
            {dashboard.revenue_series.map((item) => (
              <div key={item.date} className={scss.barItem}>
                <div
                  className={scss.bar}
                  style={{
                    height: `${Math.max((item.revenue / maxRevenue) * 100, 8)}%`,
                  }}
                />
                <small>{formatDate(item.date).slice(0, 5)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className={scss.card}>
          <h3>Финансы</h3>
          <ul>
            <li>
              <span>Товарная выручка</span>
              <strong>{formatMoney(financeSummary.product_revenue)}</strong>
            </li>
            <li>
              <span>Доставка</span>
              <strong>{formatMoney(financeSummary.delivery_income)}</strong>
            </li>
            <li>
              <span>Скидки</span>
              <strong>{formatMoney(financeSummary.discount_total)}</strong>
            </li>
            <li>
              <span>Валовая выручка</span>
              <strong>{formatMoney(financeSummary.gross_revenue)}</strong>
            </li>
            <li>
              <span>Себестоимость</span>
              <strong>{formatMoney(financeSummary.cost_of_goods_sold)}</strong>
            </li>
            <li>
              <span>Возвраты</span>
              <strong>{formatMoney(financeSummary.refund_total)}</strong>
            </li>
            <li>
              <span>Чистая выручка</span>
              <strong>{formatMoney(financeSummary.net_revenue)}</strong>
            </li>
            <li>
              <span>Прибыль</span>
              <strong>{formatMoney(financeSummary.profit)}</strong>
            </li>
          </ul>
          <p className={scss.formulaHint}>
            Прибыль = (товары + доставка - скидки) - себестоимость
          </p>
        </article>
      </div>
    </div>
  );
};
