"use client";

import { IoCloseOutline } from "react-icons/io5";
import scss from "./PaymentResultModal.module.scss";

type LeadRequestResultModalProps = {
  type: "success" | "error" | null;
  requestNumber?: string | null;
  errorMessage?: string | null;
  traceId?: string | null;
  onClose: () => void;
  onGoHome: () => void;
  onViewRequests?: () => void;
};

const TEXT = {
  close: "Закрыть",
  goHome: "Перейти на главную",
  viewRequests: "Открыть историю запросов",
  successTitle: "Запрос отправлен",
  successDescription:
    "Команда ReaLab получила ваш RFQ и свяжется для уточнения конфигурации, сроков поставки и коммерческих условий.",
  requestNumber: "Номер запроса",
  nextSteps: "Что будет дальше",
  nextStep1: "Менеджер проверит состав оборудования и сценарий использования.",
  nextStep2: "При необходимости мы уточним комплектацию, документы и сервисный контур.",
  nextStep3: "После согласования отправим КП или маршрут следующего этапа.",
  errorTitle: "Не удалось отправить запрос",
  errorDescription:
    "Попробуйте повторить отправку немного позже. Если ошибка сохраняется, свяжитесь с командой ReaLab напрямую.",
} as const;

const LeadRequestResultModal = ({
  type,
  requestNumber,
  errorMessage,
  traceId,
  onClose,
  onGoHome,
  onViewRequests,
}: LeadRequestResultModalProps) => {
  if (!type) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <div className={scss.overlay} onClick={onClose}>
      <div className={scss.modal} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={scss.closeButton} onClick={onClose} aria-label={TEXT.close}>
          <IoCloseOutline />
        </button>

        <div className={`${scss.iconWrap} ${isSuccess ? scss.success : scss.error}`}>
          <span className={scss.cardFront} />
          <span className={scss.cardBack} />
        </div>

        {isSuccess ? (
          <>
            <div className={scss.headingBlock}>
              <h3>{TEXT.successTitle}</h3>
              <p>{TEXT.successDescription}</p>
            </div>

            <div className={scss.sessionCard}>
              {requestNumber ? (
                <div className={scss.metaGrid}>
                  <div className={scss.fullRow}>
                    <span>{TEXT.requestNumber}</span>
                    <strong>{requestNumber}</strong>
                  </div>
                </div>
              ) : null}

              <div className={scss.instructionsBlock}>
                <span>{TEXT.nextSteps}</span>
                <ul>
                  <li>{TEXT.nextStep1}</li>
                  <li>{TEXT.nextStep2}</li>
                  <li>{TEXT.nextStep3}</li>
                </ul>
              </div>
            </div>

            <div className={scss.actions}>
              {onViewRequests ? (
                <button type="button" className={scss.primaryButton} onClick={onViewRequests}>
                  {TEXT.viewRequests}
                </button>
              ) : null}

              <button type="button" className={scss.homeButton} onClick={onGoHome}>
                {TEXT.goHome}
              </button>
            </div>
          </>
        ) : (
          <div className={scss.headingBlock}>
            <h3>{TEXT.errorTitle}</h3>
            <p>{errorMessage || TEXT.errorDescription}</p>
            {traceId ? <p className={scss.notice}>ID запроса: {traceId}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadRequestResultModal;
