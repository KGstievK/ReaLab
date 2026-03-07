"use client";

import { IoCloseOutline } from "react-icons/io5";
import scss from "./PaymentResultModal.module.scss";

type PaymentResultModalProps = {
  type: "success" | "error" | null;
  onClose: () => void;
  onGoHome: () => void;
};

const PaymentResultModal = ({ type, onClose, onGoHome }: PaymentResultModalProps) => {
  if (!type) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <div className={scss.overlay} onClick={onClose}>
      <div className={scss.modal} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={scss.closeButton} onClick={onClose} aria-label="Закрыть">
          <IoCloseOutline />
        </button>

        <div className={`${scss.iconWrap} ${isSuccess ? scss.success : scss.error}`}>
          <span className={scss.cardFront} />
          <span className={scss.cardBack} />
        </div>

        {isSuccess ? (
          <>
            <p>
              Ваш заказ был успешно размещен
              <br />
              и принят к обработке.
              <br />
              Доставим в течение дня!
            </p>
            <button type="button" className={scss.homeButton} onClick={onGoHome}>
              Перейти на главный
            </button>
          </>
        ) : (
          <p>
            К сожалению, у нас возникла проблема
            <br />
            с вашим платежом, повторите попытку
            <br />
            позже.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentResultModal;
