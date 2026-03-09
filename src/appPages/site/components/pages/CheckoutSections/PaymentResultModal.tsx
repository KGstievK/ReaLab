"use client";

import { IoCloseOutline } from "react-icons/io5";
import scss from "./PaymentResultModal.module.scss";

type PaymentResultModalProps = {
  type: "success" | "error" | null;
  onClose: () => void;
  onGoHome: () => void;
};

const TEXT = {
  close: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
  successLine1: "\u0412\u0430\u0448 \u0437\u0430\u043a\u0430\u0437 \u0431\u044b\u043b \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0440\u0430\u0437\u043c\u0435\u0449\u0435\u043d",
  successLine2: "\u0438 \u043f\u0440\u0438\u043d\u044f\u0442 \u043a \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0435.",
  successLine3: "\u0414\u043e\u0441\u0442\u0430\u0432\u0438\u043c \u0432 \u0442\u0435\u0447\u0435\u043d\u0438\u0435 \u0434\u043d\u044f.",
  goHome: "\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e",
  errorLine1: "\u041a \u0441\u043e\u0436\u0430\u043b\u0435\u043d\u0438\u044e, \u043f\u0440\u0438 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0438 \u0437\u0430\u043a\u0430\u0437\u0430",
  errorLine2: "\u0432\u043e\u0437\u043d\u0438\u043a\u043b\u0430 \u043e\u0448\u0438\u0431\u043a\u0430. \u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435 \u043f\u043e\u043f\u044b\u0442\u043a\u0443",
  errorLine3: "\u043d\u0435\u043c\u043d\u043e\u0433\u043e \u043f\u043e\u0437\u0436\u0435.",
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