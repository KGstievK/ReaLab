"use client";

import { useEffect, useMemo, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useGetPaymentSessionQuery } from "../../../../../redux/api/product";
import scss from "./PaymentResultModal.module.scss";

type PaymentResultModalProps = {
  type: "success" | "error" | null;
  orderId?: number | null;
  paymentSession?: PaymentSessionContract | null;
  errorMessage?: string | null;
  traceId?: string | null;
  onClose: () => void;
  onGoHome: () => void;
};

const TEXT = {
  close: "Закрыть",
  goHome: "Перейти на главную",
  openRedirect: "Открыть MBank",
  copyReference: "Скопировать код оплаты",
  copyQrPayload: "Скопировать QR-сессию",
  copied: "Скопировано",
  orderCreated: "Заказ создан",
  orderCreatedDescription: "Мы сохранили ваш заказ. Далее завершите оплату выбранным способом.",
  manualSuccess: "Ваш заказ был успешно размещен и принят к обработке.",
  mbankTitle: "Оплата через MBank",
  fincaTitle: "QR-оплата через FINCA Bank",
  amount: "Сумма",
  orderNumber: "Номер заказа",
  sessionId: "Код сессии",
  reference: "Код оплаты",
  expiresAt: "Действует до",
  qrPayload: "Строка QR-сессии",
  redirectPayload: "Payload для redirect bridge",
  nextSteps: "Что делать дальше",
  errorLine1: "К сожалению, при оформлении заказа",
  errorLine2: "возникла ошибка. Повторите попытку",
  errorLine3: "немного позже.",
  noRedirectUrl: "Прямой redirect URL пока не настроен. Используйте код оплаты и payload bridge.",
} as const;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU");
};

const PaymentResultModal = ({
  type,
  orderId,
  paymentSession,
  errorMessage,
  traceId,
  onClose,
  onGoHome,
}: PaymentResultModalProps) => {
  const shouldLoadSession = type === "success" && !!orderId && !paymentSession;
  const { data: fetchedPaymentSession } = useGetPaymentSessionQuery(orderId as number, {
    skip: !shouldLoadSession,
  });

  const resolvedPaymentSession = paymentSession ?? fetchedPaymentSession ?? null;
  const [copiedKey, setCopiedKey] = useState<"reference" | "payload" | null>(null);

  useEffect(() => {
    if (!type) {
      setCopiedKey(null);
    }
  }, [type]);

  const redirectPayloadText = useMemo(() => {
    if (!resolvedPaymentSession?.redirect_payload) {
      return "";
    }

    return JSON.stringify(resolvedPaymentSession.redirect_payload, null, 2);
  }, [resolvedPaymentSession]);

  if (!type) {
    return null;
  }

  const isSuccess = type === "success";
  const isRedirect = resolvedPaymentSession?.kind === "redirect";
  const isQr = resolvedPaymentSession?.kind === "qr";
  const expiresAt = formatDateTime(resolvedPaymentSession?.expires_at ?? null);

  const copyValue = async (value: string, key: "reference" | "payload") => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleOpenRedirect = () => {
    if (!resolvedPaymentSession?.redirect_url) {
      return;
    }

    window.open(resolvedPaymentSession.redirect_url, "_blank", "noopener,noreferrer");
  };

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
              <h3>
                {isRedirect
                  ? TEXT.mbankTitle
                  : isQr
                    ? TEXT.fincaTitle
                    : TEXT.orderCreated}
              </h3>
              <p>
                {resolvedPaymentSession?.kind === "manual"
                  ? TEXT.manualSuccess
                  : TEXT.orderCreatedDescription}
              </p>
            </div>

            {resolvedPaymentSession ? (
              <div className={scss.sessionCard}>
                <div className={scss.metaGrid}>
                  <div>
                    <span>{TEXT.orderNumber}</span>
                    <strong>{resolvedPaymentSession.order_number}</strong>
                  </div>
                  <div>
                    <span>{TEXT.amount}</span>
                    <strong>{resolvedPaymentSession.amount} {resolvedPaymentSession.currency}</strong>
                  </div>
                  <div>
                    <span>{TEXT.sessionId}</span>
                    <strong>{resolvedPaymentSession.session_id}</strong>
                  </div>
                  <div>
                    <span>{TEXT.reference}</span>
                    <strong>{resolvedPaymentSession.reference}</strong>
                  </div>
                  {expiresAt ? (
                    <div className={scss.fullRow}>
                      <span>{TEXT.expiresAt}</span>
                      <strong>{expiresAt}</strong>
                    </div>
                  ) : null}
                </div>

                {isQr && resolvedPaymentSession.qr_payload ? (
                  <div className={scss.payloadCard}>
                    <span>{TEXT.qrPayload}</span>
                    <pre>{resolvedPaymentSession.qr_payload}</pre>
                  </div>
                ) : null}

                {isRedirect && resolvedPaymentSession.redirect_payload ? (
                  <div className={scss.payloadCard}>
                    <span>{TEXT.redirectPayload}</span>
                    <pre>{redirectPayloadText}</pre>
                  </div>
                ) : null}

                <div className={scss.instructionsBlock}>
                  <span>{TEXT.nextSteps}</span>
                  <ul>
                    {resolvedPaymentSession.instructions.map((instruction) => (
                      <li key={instruction}>{instruction}</li>
                    ))}
                  </ul>
                </div>

                {isRedirect && !resolvedPaymentSession.redirect_url ? (
                  <p className={scss.notice}>{TEXT.noRedirectUrl}</p>
                ) : null}
              </div>
            ) : (
              <div className={scss.sessionCard}>
                <p>{TEXT.manualSuccess}</p>
              </div>
            )}

            <div className={scss.actions}>
              {isRedirect && resolvedPaymentSession?.redirect_url ? (
                <button type="button" className={scss.primaryButton} onClick={handleOpenRedirect}>
                  {TEXT.openRedirect}
                </button>
              ) : null}

              {resolvedPaymentSession?.reference ? (
                <button
                  type="button"
                  className={scss.secondaryButton}
                  onClick={() => copyValue(resolvedPaymentSession.reference, "reference")}
                >
                  {copiedKey === "reference" ? TEXT.copied : TEXT.copyReference}
                </button>
              ) : null}

              {isQr && resolvedPaymentSession?.qr_payload ? (
                <button
                  type="button"
                  className={scss.secondaryButton}
                  onClick={() => copyValue(resolvedPaymentSession.qr_payload || "", "payload")}
                >
                  {copiedKey === "payload" ? TEXT.copied : TEXT.copyQrPayload}
                </button>
              ) : null}

              <button type="button" className={scss.homeButton} onClick={onGoHome}>
                {TEXT.goHome}
              </button>
            </div>
          </>
        ) : (
          <div className={scss.headingBlock}>
            <h3>Ошибка оформления</h3>
            <p>
              {errorMessage || (
                <>
                  {TEXT.errorLine1}
                  <br />
                  {TEXT.errorLine2}
                  <br />
                  {TEXT.errorLine3}
                </>
              )}
            </p>
            {traceId ? <p className={scss.notice}>ID запроса: {traceId}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResultModal;
