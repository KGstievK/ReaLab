"use client";

import scss from "../AdminPanel.module.scss";
import { formatDate } from "../AdminPanel.shared";
import { resolveMediaUrl } from "@/utils/media";

type AdminRequestsSectionProps = {
  requests: AdminPaginatedResponse<AdminLeadRequest>;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  search: string;
  kindFilter: LeadRequestKind | "all";
  statusFilter: LeadRequestStatus | "all";
  dateFrom: string;
  dateTo: string;
  selectedRequest: AdminLeadRequest | null;
  managerNoteDraft: string;
  canManageRequests: boolean;
  isUpdatingRequestStatus: boolean;
  onSearchChange: (value: string) => void;
  onKindFilterChange: (value: LeadRequestKind | "all") => void;
  onStatusFilterChange: (value: LeadRequestStatus | "all") => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelectRequest: (request: AdminLeadRequest) => void;
  onManagerNoteChange: (value: string) => void;
  onChangeRequestStatus: (id: number, status: LeadRequestStatus) => Promise<void>;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

const KIND_LABELS: Record<LeadRequestKind, string> = {
  rfq: "RFQ",
  consultation: "Консультация",
  demo: "Демонстрация",
  service: "Сервис",
  partner: "Партнерство",
};

const STATUS_LABELS: Record<LeadRequestStatus, string> = {
  new: "Новая",
  qualified: "Квалификация",
  quoted: "КП отправлено",
  in_progress: "В работе",
  won: "Успешно",
  lost: "Потеряна",
  closed: "Закрыта",
};

const STATUS_FLOW: LeadRequestStatus[] = [
  "new",
  "qualified",
  "quoted",
  "in_progress",
  "won",
  "lost",
  "closed",
];

const getProgressIndex = (status: LeadRequestStatus) => {
  if (status === "won") {
    return STATUS_FLOW.indexOf("in_progress");
  }

  return STATUS_FLOW.indexOf(status);
};

const formatContactLabel = (request: AdminLeadRequest) => {
  if (request.company) {
    return `${request.name} · ${request.company}`;
  }

  return request.name;
};

const renderRequestItemPreview = (item: LeadRequestItem) => {
  const imageUrl = resolveMediaUrl(item.image_url);

  if (!imageUrl) {
    return <div className={scss.orderItemPlaceholder}>Без изображения</div>;
  }

  return <img src={imageUrl} alt={item.product_name || "Позиция"} />;
};

export const AdminRequestsSection = ({
  requests,
  totalCount,
  currentPage,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  search,
  kindFilter,
  statusFilter,
  dateFrom,
  dateTo,
  selectedRequest,
  managerNoteDraft,
  canManageRequests,
  isUpdatingRequestStatus,
  onSearchChange,
  onKindFilterChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onResetFilters,
  onPageChange,
  onPageSizeChange,
  onSelectRequest,
  onManagerNoteChange,
  onChangeRequestStatus,
}: AdminRequestsSectionProps) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);
  const selectedProgressIndex = selectedRequest ? getProgressIndex(selectedRequest.status) : -1;

  return (
    <div className={scss.panel}>
      <div className={scss.panelHead}>
        <div>
          <h2>Заявки и RFQ</h2>
          <p className={scss.panelNote}>
            Показано <strong>{rangeStart}-{rangeEnd}</strong> из <strong>{totalCount}</strong>
          </p>
        </div>
      </div>

      <div className={scss.requestFilters} role="search" aria-label="Фильтры заявок">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по номеру, компании, email или позиции"
          aria-label="Поиск по номеру, компании, email или позиции"
        />
        <select
          aria-label="Фильтр по типу заявки"
          value={kindFilter}
          onChange={(event) => onKindFilterChange(event.target.value as LeadRequestKind | "all")}
        >
          <option value="all">Все типы</option>
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Фильтр по статусу заявки"
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as LeadRequestStatus | "all")
          }
        >
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          aria-label="Дата заявки от"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          aria-label="Дата заявки до"
        />
        <button type="button" className={scss.secondaryAction} onClick={onResetFilters}>
          Сбросить фильтры
        </button>
      </div>

      <div className={scss.tableWrap}>
        <table>
          <caption className={scss.srOnly}>Таблица заявок ReaLab</caption>
          <thead>
            <tr>
              <th scope="col">Номер</th>
              <th scope="col">Тип</th>
              <th scope="col">Клиент</th>
              <th scope="col">Дата</th>
              <th scope="col">Позиции</th>
              <th scope="col">Статус</th>
              <th scope="col">Действие</th>
            </tr>
          </thead>
          <tbody>
            {requests.results.length ? (
              requests.results.map((item) => (
                <tr
                  key={item.id}
                  className={scss.clickableRow}
                  onClick={() => onSelectRequest(item)}
                >
                  <td>{item.request_number}</td>
                  <td>{KIND_LABELS[item.kind]}</td>
                  <td>
                    <div className={scss.inventoryProduct}>
                      <strong>{formatContactLabel(item)}</strong>
                      <span>{item.email || item.phone}</span>
                    </div>
                  </td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{item.items_count} / {item.total_units}</td>
                  <td>{STATUS_LABELS[item.status]}</td>
                  <td>
                    <button
                      type="button"
                      className={scss.secondaryAction}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectRequest(item);
                      }}
                    >
                      Детали
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>Заявки не найдены.</td>
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
              aria-label="Количество заявок на странице"
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
          <div className={scss.auditPagerActions}>
            <button
              type="button"
              className={scss.secondaryAction}
              disabled={!hasPreviousPage}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Предыдущая страница заявок"
            >
              Назад
            </button>
            <button
              type="button"
              className={scss.secondaryAction}
              disabled={!hasNextPage}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Следующая страница заявок"
            >
              Далее
            </button>
          </div>
        </div>
      </div>

      {selectedRequest ? (
        <div className={scss.requestDetailGrid}>
          <div className={scss.orderDetailCard}>
            <div className={scss.orderSectionHead}>
              <h4>{selectedRequest.request_number}</h4>
              <span>{KIND_LABELS[selectedRequest.kind]}</span>
            </div>

            <dl className={scss.requestMetaGrid}>
              <div className={scss.requestMetaCard}>
                <dt>Контакт</dt>
                <dd>{selectedRequest.name || "Не указан"}</dd>
              </div>
              <div className={scss.requestMetaCard}>
                <dt>Компания</dt>
                <dd>{selectedRequest.company || "Не указана"}</dd>
              </div>
              <div className={scss.requestMetaCard}>
                <dt>Дата</dt>
                <dd>{formatDate(selectedRequest.created_at)}</dd>
              </div>
              <div className={scss.requestMetaCard}>
                <dt>Позиции</dt>
                <dd>{selectedRequest.items_count} / {selectedRequest.total_units}</dd>
              </div>
            </dl>

            <div className={scss.orderDetailsGrid}>
              <div className={scss.softCard}>
                <div className={scss.softCardHead}>
                  <h3>Контактные данные</h3>
                  <span>{STATUS_LABELS[selectedRequest.status]}</span>
                </div>
                <p className={scss.mutedText}>{selectedRequest.email || "Email не указан"}</p>
                <p className={scss.mutedText}>{selectedRequest.phone || "Телефон не указан"}</p>
                <p className={scss.mutedText}>
                  {[selectedRequest.city, selectedRequest.country].filter(Boolean).join(", ") ||
                    "Локация не указана"}
                </p>
              </div>

              <div className={scss.softCard}>
                <div className={scss.softCardHead}>
                  <h3>Контекст</h3>
                  <span>{selectedRequest.organization_type || "Общий запрос"}</span>
                </div>
                <p className={scss.mutedText}>
                  {selectedRequest.request_purpose || "Без уточненной цели запроса"}
                </p>
                <p className={scss.mutedText}>
                  {selectedRequest.comment || "Комментарий клиента не оставлен."}
                </p>
              </div>
            </div>

            <div className={scss.softCard}>
              <div className={scss.softCardHead}>
                <h3>Состав заявки</h3>
                <span>{selectedRequest.items_count}</span>
              </div>

              {selectedRequest.items.length ? (
                <div className={scss.orderItemsList}>
                  {selectedRequest.items.map((item) => (
                    <article key={item.id} className={scss.orderItemRow}>
                      <div className={scss.orderItemPreview}>
                        {renderRequestItemPreview(item)}
                      </div>
                      <div className={scss.orderItemInfo}>
                        <strong>{item.product_name || "Позиция без привязки"}</strong>
                        <span>{item.configuration_label || "Конфигурация уточняется"}</span>
                        <span>{item.color_label || "Исполнение не указано"}</span>
                      </div>
                      <div className={scss.orderItemMeta}>
                        <span>Количество</span>
                        <strong>{item.quantity}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={scss.mutedText}>
                  Клиент отправил общий запрос без прикрепленных позиций.
                </p>
              )}
            </div>
          </div>

          <div className={scss.requestStatusCard}>
            <div className={scss.softCardHead}>
              <h3>Статус и менеджерская заметка</h3>
              <span>{STATUS_LABELS[selectedRequest.status]}</span>
            </div>

            <div className={scss.statusFlow}>
              {STATUS_FLOW.map((status) => {
                const isActive = selectedRequest.status === status;
                const isCompleted =
                  selectedProgressIndex >= 0 &&
                  selectedRequest.status !== "lost" &&
                  selectedRequest.status !== "closed" &&
                  STATUS_FLOW.indexOf(status) <= selectedProgressIndex;

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
                    disabled={!canManageRequests || isUpdatingRequestStatus}
                    onClick={() => void onChangeRequestStatus(selectedRequest.id, status)}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>

            <label className={scss.formField}>
              <span>Заметка менеджера</span>
              <textarea
                value={managerNoteDraft}
                onChange={(event) => onManagerNoteChange(event.target.value)}
                placeholder="Следующий шаг, комментарий по комплектации, документам или срокам."
              />
            </label>

            <div className={scss.requestActions}>
              <button
                type="button"
                className={scss.action}
                disabled={!canManageRequests || isUpdatingRequestStatus}
                onClick={() =>
                  void onChangeRequestStatus(selectedRequest.id, selectedRequest.status)
                }
              >
                {isUpdatingRequestStatus ? "Сохраняем..." : "Сохранить заметку"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
