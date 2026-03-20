"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiCheckCircle, FiClock, FiFileText, FiXCircle } from "react-icons/fi";
import { useGetMyLeadRequestsQuery } from "../../../../../../../../redux/api/product";
import { resolveMediaUrl } from "@/utils/media";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";
import styles from "./RequestHistory.module.scss";

type RequestTab = "active" | "archive";

const STATUS_LABELS: Record<LeadRequestStatus, string> = {
  new: "Новая",
  qualified: "Квалификация",
  quoted: "КП отправлено",
  in_progress: "В работе",
  won: "Успешно",
  lost: "Потеряна",
  closed: "Закрыта",
};

const STATUS_MESSAGES: Record<LeadRequestStatus, string> = {
  new: "Запрос зарегистрирован и передан команде ReaLab.",
  qualified: "Менеджер уточняет клинический сценарий и состав поставки.",
  quoted: "Коммерческое предложение подготовлено или отправлено.",
  in_progress: "Заявка находится в активной проработке.",
  won: "Запрос согласован и переведен в следующий коммерческий этап.",
  lost: "Запрос закрыт без продолжения. Вы можете отправить его повторно.",
  closed: "Заявка закрыта после завершения коммуникации.",
};

const KIND_LABELS: Record<LeadRequestKind, string> = {
  rfq: "RFQ",
  consultation: "Консультация",
  demo: "Демонстрация",
  service: "Сервис",
  partner: "Партнерство",
};

const ACTIVE_STATUSES: LeadRequestStatus[] = ["new", "qualified", "quoted", "in_progress"];
const ARCHIVE_STATUSES: LeadRequestStatus[] = ["won", "lost", "closed"];
const TIMELINE_STATUSES: LeadRequestStatus[] = [
  "new",
  "qualified",
  "quoted",
  "in_progress",
  "won",
  "closed",
];

const formatDate = (raw: string) =>
  new Date(raw).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatDateTime = (raw: string) =>
  new Date(raw).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusToneClass = (status: LeadRequestStatus) => {
  if (status === "won") {
    return styles.statusSuccess;
  }

  if (status === "lost") {
    return styles.statusDanger;
  }

  if (status === "closed") {
    return styles.statusNeutral;
  }

  return styles.statusActive;
};

const getTimelineIcon = (status: LeadRequestStatus) => {
  if (status === "won") {
    return <FiCheckCircle />;
  }

  if (status === "lost") {
    return <FiXCircle />;
  }

  return <FiClock />;
};

const getProgressIndex = (status: LeadRequestStatus) => {
  if (status === "lost") {
    return TIMELINE_STATUSES.indexOf("quoted");
  }

  return TIMELINE_STATUSES.indexOf(status);
};

const RequestHistory = () => {
  const { data, isLoading, isError, error, refetch } = useGetMyLeadRequestsQuery();
  const [tab, setTab] = useState<RequestTab>("active");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const requests = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      ),
    [requests],
  );

  const activeRequests = useMemo(
    () => sortedRequests.filter((item) => ACTIVE_STATUSES.includes(item.status)),
    [sortedRequests],
  );

  const archivedRequests = useMemo(
    () => sortedRequests.filter((item) => ARCHIVE_STATUSES.includes(item.status)),
    [sortedRequests],
  );

  useEffect(() => {
    if (tab === "active" && activeRequests.length === 0 && archivedRequests.length > 0) {
      setTab("archive");
    }

    if (tab === "archive" && archivedRequests.length === 0 && activeRequests.length > 0) {
      setTab("active");
    }
  }, [activeRequests.length, archivedRequests.length, tab]);

  const visibleRequests = tab === "active" ? activeRequests : archivedRequests;

  useEffect(() => {
    if (!visibleRequests.length) {
      setSelectedRequestId(null);
      return;
    }

    if (!selectedRequestId || !visibleRequests.some((item) => item.id === selectedRequestId)) {
      setSelectedRequestId(visibleRequests[0].id);
    }
  }, [selectedRequestId, visibleRequests]);

  const selectedRequest = useMemo(
    () => visibleRequests.find((item) => item.id === selectedRequestId) ?? null,
    [selectedRequestId, visibleRequests],
  );

  return (
    <section className={styles.RequestHistory}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Мои заявки ReaLab</h1>
          <p className={styles.subtitle}>
            История RFQ, консультаций и сервисных обращений с текущим статусом обработки.
          </p>
        </div>
        <Link href="/catalog" className={styles.catalogLink}>
          Каталог оборудования
          <FiArrowRight />
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.statusState}>
          <p>Загружаем историю заявок...</p>
        </div>
      ) : null}

      {isError ? (
        <div className={`${styles.statusState} ${styles.statusStateError}`} role="alert">
          <p>
            {getRateLimitAwareMessage(
              extractApiErrorInfo(error, "Не удалось загрузить историю заявок"),
              "Не удалось загрузить историю заявок. Попробуйте позже.",
            )}
          </p>
          <button type="button" onClick={() => void refetch()}>
            Повторить
          </button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Категории заявок">
            <button
              type="button"
              className={`${styles.tab} ${tab === "active" ? styles.active : ""}`}
              onClick={() => setTab("active")}
              role="tab"
              aria-selected={tab === "active"}
            >
              Активные
              <span className={styles.tabBadge}>{activeRequests.length}</span>
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === "archive" ? styles.active : ""}`}
              onClick={() => setTab("archive")}
              role="tab"
              aria-selected={tab === "archive"}
            >
              Архив
              <span className={styles.tabBadge}>{archivedRequests.length}</span>
            </button>
          </div>

          {selectedRequest ? (
            <div className={styles.detailPanel}>
              <div className={styles.detailHeader}>
                <div>
                  <span className={`${styles.statusChip} ${getStatusToneClass(selectedRequest.status)}`}>
                    {STATUS_LABELS[selectedRequest.status]}
                  </span>
                  <h2>{selectedRequest.request_number}</h2>
                  <p>{STATUS_MESSAGES[selectedRequest.status]}</p>
                </div>
                <div className={styles.detailMetaTop}>
                  <span>{KIND_LABELS[selectedRequest.kind]}</span>
                  <span>{formatDateTime(selectedRequest.created_at)}</span>
                </div>
              </div>

              <div className={styles.timeline}>
                {TIMELINE_STATUSES.map((status) => {
                  const currentProgress = getProgressIndex(selectedRequest.status);
                  const statusIndex = TIMELINE_STATUSES.indexOf(status);
                  const isActive = selectedRequest.status === status;
                  const isDone = currentProgress >= statusIndex;

                  return (
                    <div
                      key={status}
                      className={`${styles.timelineItem} ${
                        isActive ? styles.timelineItemActive : isDone ? styles.timelineItemDone : ""
                      }`}
                    >
                      <div className={styles.timelineIcon}>{getTimelineIcon(status)}</div>
                      <span>{STATUS_LABELS[status]}</span>
                    </div>
                  );
                })}
              </div>

              <div className={styles.metaGrid}>
                <article className={styles.metaCard}>
                  <span>Контакт</span>
                  <strong>{selectedRequest.name || "Не указан"}</strong>
                  <small>{selectedRequest.email || selectedRequest.phone || "Без контакта"}</small>
                </article>
                <article className={styles.metaCard}>
                  <span>Организация</span>
                  <strong>{selectedRequest.company || "Не указана"}</strong>
                  <small>
                    {selectedRequest.organization_type || "Тип организации не указан"}
                  </small>
                </article>
                <article className={styles.metaCard}>
                  <span>Позиции</span>
                  <strong>{selectedRequest.items_count}</strong>
                  <small>{selectedRequest.total_units} ед. в запросе</small>
                </article>
                <article className={styles.metaCard}>
                  <span>Локация</span>
                  <strong>
                    {[selectedRequest.city, selectedRequest.country].filter(Boolean).join(", ") ||
                      "Не указана"}
                  </strong>
                  <small>{formatDate(selectedRequest.created_at)}</small>
                </article>
              </div>

              <div className={styles.detailGrid}>
                <article className={styles.detailCard}>
                  <h3>Контекст запроса</h3>
                  <ul className={styles.definitionList}>
                    <li>
                      <span>Цель</span>
                      <strong>{selectedRequest.request_purpose || "Общий RFQ"}</strong>
                    </li>
                    <li>
                      <span>Тип</span>
                      <strong>{KIND_LABELS[selectedRequest.kind]}</strong>
                    </li>
                    <li>
                      <span>Комментарий</span>
                      <strong>{selectedRequest.comment || "Без дополнительного комментария"}</strong>
                    </li>
                  </ul>
                </article>

                <article className={styles.detailCard}>
                  <h3>Следующий шаг ReaLab</h3>
                  <p className={styles.noteText}>{STATUS_MESSAGES[selectedRequest.status]}</p>
                  {selectedRequest.manager_note ? (
                    <div className={styles.managerNote}>
                      <span>Комментарий менеджера</span>
                      <p>{selectedRequest.manager_note}</p>
                    </div>
                  ) : (
                    <div className={styles.managerNote}>
                      <span>Комментарий менеджера</span>
                      <p>Комментарий появится после обработки запроса командой ReaLab.</p>
                    </div>
                  )}
                </article>
              </div>

              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <h3>Состав запроса</h3>
                  <span>{selectedRequest.items_count}</span>
                </div>

                {selectedRequest.items.length ? (
                  <div className={styles.itemList}>
                    {selectedRequest.items.map((item) => {
                      const imageUrl = resolveMediaUrl(item.image_url) || "/fallback-image.png";

                      return (
                        <article key={item.id} className={styles.itemRow}>
                          <div className={styles.itemPreview}>
                            <img src={imageUrl} alt={item.product_name || "Позиция"} />
                          </div>
                          <div className={styles.itemInfo}>
                            <strong>{item.product_name || "Позиция без названия"}</strong>
                            <span>{item.configuration_label || "Конфигурация уточняется"}</span>
                            <span>{item.color_label || "Исполнение уточняется"}</span>
                          </div>
                          <div className={styles.itemMeta}>
                            <span>Количество</span>
                            <strong>{item.quantity}</strong>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyInline}>
                    <p>Запрос был отправлен без прикрепленных позиций. Команда ReaLab уточнит потребность вручную.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {visibleRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>
                {tab === "active"
                  ? "У вас пока нет активных заявок"
                  : "Архив заявок пока пуст"}
              </h3>
              <p>
                Сформируйте shortlist оборудования или отправьте общий RFQ, чтобы история запросов появилась в кабинете.
              </p>
              <div className={styles.emptyActions}>
                <Link href="/catalog" className={styles.primaryLink}>
                  Перейти в каталог
                </Link>
                <Link href="/contacts" className={styles.secondaryLink}>
                  Связаться с ReaLab
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.content}>
              {visibleRequests.map((request) => (
                <article key={request.id} className={styles.requestCard}>
                  <div className={styles.requestMain}>
                    <div className={styles.requestHead}>
                      <div>
                        <span className={`${styles.statusChip} ${getStatusToneClass(request.status)}`}>
                          {STATUS_LABELS[request.status]}
                        </span>
                        <h3>{request.request_number}</h3>
                      </div>
                      <span className={styles.requestType}>{KIND_LABELS[request.kind]}</span>
                    </div>

                    <p className={styles.requestCopy}>
                      {request.company
                        ? `${request.company} · ${request.name}`
                        : request.name || "Контакт не указан"}
                    </p>
                    <div className={styles.requestFacts}>
                      <span>{formatDate(request.created_at)}</span>
                      <span>{request.items_count} поз.</span>
                      <span>{request.total_units} ед.</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`${styles.detailButton} ${
                      selectedRequest?.id === request.id ? styles.detailButtonActive : ""
                    }`}
                    onClick={() => setSelectedRequestId(request.id)}
                    aria-pressed={selectedRequest?.id === request.id}
                  >
                    {selectedRequest?.id === request.id ? "Выбрано" : "Открыть"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
};

export default RequestHistory;
