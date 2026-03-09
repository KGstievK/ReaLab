"use client";

import { IoCloseOutline } from "react-icons/io5";
import scss from "./PaymentResultModal.module.scss";

type PaymentResultModalProps = {
  type: "success" | "error" | null;
  onClose: () => void;
  onGoHome: () => void;
};

const TEXT = {
  close: "Закрыть",
  successLine1: "Ваш заказ был успешно размещен",
  successLine2: "и принят к обработке.",
  successLine3: "Доставим в течение дня.",
  goHome: "Перейти на главную",
  errorLine1: "К сожалению, при оформлении заказа",
  errorLine2: "возникла ошибка. Повторите попытку",
  errorLine3: "немного позже.",
} as const;

const PaymentResultModal = ({ type, onClose, onGoHome }: PaymentResultModalProps) => {
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
            <p>
              {TEXT.successLine1}
              <br />
              {TEXT.successLine2}
              <br />
              {TEXT.successLine3}
            </p>
            <button type="button" className={scss.homeButton} onClick={onGoHome}>
              {TEXT.goHome}
            </button>
          </>
        ) : (
          <p>
            {TEXT.errorLine1}
            <br />
            {TEXT.errorLine2}
            <br />
            {TEXT.errorLine3}
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentResultModal;
