"use client";

import scss from "../AdminPanel.module.scss";
import { formatDate, formatRoleLabel } from "../AdminPanel.shared";

type AdminActivitySectionProps = {
  activities: AdminPaginatedResponse<AdminActivityEvent>;
  auditLogs: AdminPaginatedResponse<AdminAuditLog>;
  search: string;
  entityFilter: AdminActivityEvent["entity"] | "all";
  actionFilter: string;
  traceIdFilter: string;
  actorIdFilter: number | "all";
  actorOptions: Array<{ id: number; label: string }>;
  activityPage: number;
  activityPageSize: number;
  auditPage: number;
  auditPageSize: number;
  onSearchChange: (value: string) => void;
  onEntityFilterChange: (value: AdminActivityEvent["entity"] | "all") => void;
  onActionFilterChange: (value: string) => void;
  onTraceIdFilterChange: (value: string) => void;
  onActorFilterChange: (value: number | "all") => void;
  onActivityPageChange: (page: number) => void;
  onAuditPageChange: (page: number) => void;
  onResetFilters: () => void;
};

const ENTITY_LABELS: Record<AdminActivityEvent["entity"], string> = {
  product: "Товары",
  order: "Заказы",
  category: "Категории",
  content: "Контент",
  user: "Пользователи",
};

const getTotalPages = (count: number, pageSize: number) => Math.max(1, Math.ceil(count / pageSize));

const formatAuditValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.length ? value.map((item) => String(item)).join(", ") : "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  return String(value);
};

const renderSnapshot = (snapshot: Record<string, unknown> | null) => {
  if (!snapshot || !Object.keys(snapshot).length) {
    return <span className={scss.auditEmpty}>—</span>;
  }

  return (
    <ul className={scss.auditSnapshot}>
      {Object.entries(snapshot).map(([key, value]) => (
        <li key={key}>
          <strong>{key}</strong>
          <span>{formatAuditValue(value)}</span>
        </li>
      ))}
    </ul>
  );
};

const renderPager = (
  page: number,
  totalPages: number,
  onChange: (page: number) => void,
) => (
  <div className={scss.auditPager}>
    <span>
      Страница {page} из {totalPages}
    </span>
    <div className={scss.auditPagerActions}>
      <button type="button" className={scss.secondaryAction} onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Назад
      </button>
      <button
        type="button"
        className={scss.secondaryAction}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Вперёд
      </button>
    </div>
  </div>
);

export const AdminActivitySection = ({
  activities,
  auditLogs,
  search,
  entityFilter,
  actionFilter,
  traceIdFilter,
  actorIdFilter,
  actorOptions,
  activityPage,
  activityPageSize,
  auditPage,
  auditPageSize,
  onSearchChange,
  onEntityFilterChange,
  onActionFilterChange,
  onTraceIdFilterChange,
  onActorFilterChange,
  onActivityPageChange,
  onAuditPageChange,
  onResetFilters,
}: AdminActivitySectionProps) => {
  const activityTotalPages = getTotalPages(activities.count, activityPageSize);
  const auditTotalPages = getTotalPages(auditLogs.count, auditPageSize);

  return (
    <div className={scss.panel}>
      <div className={scss.panelHead}>
        <div>
          <h2>События и аудит</h2>
          <p className={scss.panelNote}>
            Операционная лента событий и отдельный журнал изменений по критичным действиям админки.
          </p>
        </div>
      </div>

      <div className={scss.auditFilters}>
        <select
          value={entityFilter}
          onChange={(event) =>
            onEntityFilterChange(event.target.value as AdminActivityEvent["entity"] | "all")
          }
        >
          <option value="all">Все сущности</option>
          {Object.entries(ENTITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по сообщению, объекту или исполнителю"
        />

        <input
          value={actionFilter}
          onChange={(event) => onActionFilterChange(event.target.value)}
          placeholder="Фильтр по action, например role.update"
        />

        <input
          value={traceIdFilter}
          onChange={(event) => onTraceIdFilterChange(event.target.value)}
          placeholder="Поиск по trace ID"
        />

        <select
          value={actorIdFilter === "all" ? "all" : String(actorIdFilter)}
          onChange={(event) =>
            onActorFilterChange(event.target.value === "all" ? "all" : Number(event.target.value))
          }
        >
          <option value="all">Все исполнители</option>
          {actorOptions.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.label}
            </option>
          ))}
        </select>

        <button type="button" className={scss.secondaryAction} onClick={onResetFilters}>
          Сбросить фильтры
        </button>
      </div>

      <div className={scss.activityAuditGrid}>
        <section className={scss.activityColumn}>
          <div className={scss.subsectionHead}>
            <h3>Лента событий</h3>
            <span>{activities.count}</span>
          </div>

          {activities.results.length ? (
            <>
              <ul className={scss.activity}>
                {activities.results.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.entity_label}</strong>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <p>{item.message}</p>
                    <small>
                      {item.actor.name} · {formatRoleLabel(item.actor.role)}
                    </small>
                  </li>
                ))}
              </ul>
              {renderPager(activityPage, activityTotalPages, onActivityPageChange)}
            </>
          ) : (
            <div className={scss.tableWrap}>
              <table>
                <tbody>
                  <tr>
                    <td>События не найдены.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={scss.auditColumn}>
          <div className={scss.subsectionHead}>
            <h3>Журнал аудита</h3>
            <span>{auditLogs.count}</span>
          </div>

          {auditLogs.results.length ? (
            <>
              <div className={scss.auditList}>
                {auditLogs.results.map((item) => (
                  <article key={item.id} className={scss.auditCard}>
                    <div className={scss.auditTop}>
                      <div>
                        <strong>{item.message}</strong>
                        <p>
                          {item.entity_label} · {item.action}
                        </p>
                      </div>
                      <span>{formatDate(item.created_at)}</span>
                    </div>

                    <div className={scss.auditMeta}>
                      <span>
                        Исполнитель: {item.actor ? `${item.actor.name} · ${formatRoleLabel(item.actor.role)}` : "Система"}
                      </span>
                      <span>Сущность: {ENTITY_LABELS[item.entity]}</span>
                      {item.trace_id ? <span>ID запроса: {item.trace_id}</span> : null}
                    </div>

                    <div className={scss.auditDiff}>
                      <div>
                        <h4>Было</h4>
                        {renderSnapshot(item.before)}
                      </div>
                      <div>
                        <h4>Стало</h4>
                        {renderSnapshot(item.after)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {renderPager(auditPage, auditTotalPages, onAuditPageChange)}
            </>
          ) : (
            <div className={scss.tableWrap}>
              <table>
                <tbody>
                  <tr>
                    <td>Записи аудита не найдены.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
