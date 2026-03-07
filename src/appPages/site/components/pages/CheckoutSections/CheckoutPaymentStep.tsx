"use client";

import Image from "next/image";
import Mbank from "@/assets/images/Mbank.svg";
import scss from "./CheckoutSection.module.scss";
import {
  PAYMENT_METHOD_OPTIONS,
  PaymentMethod,
  isQrPaymentMethod,
} from "./paymentMethods";

export type CheckoutQrItem = {
  pay_img: string;
  info: string;
  number: string;
};

type CheckoutPaymentStepProps = {
  paymentMethod: PaymentMethod;
  onChangeMethod: (method: PaymentMethod) => void;
  qrItems: CheckoutQrItem[];
  qrWhatsapp?: string;
  error?: string;
};

const CheckoutPaymentStep = ({
  paymentMethod,
  onChangeMethod,
  qrItems,
  qrWhatsapp,
  error,
}: CheckoutPaymentStepProps) => {
  const selectedMethod =
    PAYMENT_METHOD_OPTIONS.find((item) => item.id === paymentMethod) ??
    PAYMENT_METHOD_OPTIONS[0];

  return (
    <div className={scss.section}>
      <h2>
        {
          "\u041e\u041f\u041b\u0410\u0422\u0418\u0422\u042c \u0427\u0415\u0420\u0415\u0417:"
        }
      </h2>

      <div className={scss.paymentMethods}>
        {PAYMENT_METHOD_OPTIONS.map((method) => (
          <button
            key={method.id}
            type="button"
            className={`${scss.paymentMethodCard} ${
              paymentMethod === method.id ? scss.selected : ""
            }`}
            onClick={() => onChangeMethod(method.id)}
          >
            <span className={scss.radio} />
            <span
              className={
                method.id === "mbank_redirect" ? scss.mbank : scss.finca
              }
            >
              {method.id === "mbank_redirect" ? (
                <Image src={Mbank} alt="MBank" />
              ) : (
                method.label
              )}
            </span>
          </button>
        ))}
      </div>

      <div className={scss.paymentInfoCard}>
        <h4>{selectedMethod.label}</h4>
        <p>{selectedMethod.description}</p>
      </div>

      {isQrPaymentMethod(paymentMethod) && (
        <div className={scss.qrBlock}>
          <p>
            {
              "\u041e\u043f\u043b\u0430\u0442\u0438\u0442\u0435 \u043f\u043e QR-\u043a\u043e\u0434\u0443 \u0438 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043e\u043f\u043b\u0430\u0442\u0443."
            }
          </p>

          <div className={scss.qrGrid}>
            {qrItems.map((item, index) => (
              <article key={index} className={scss.qrCard}>
                <Image
                  width={120}
                  height={120}
                  src={item.pay_img}
                  alt={`qr-${index + 1}`}
                />
                <h5>{item.number}</h5>
                <p>{item.info}</p>
              </article>
            ))}
          </div>

          {qrWhatsapp && (
            <a href={qrWhatsapp} target="_blank" rel="noreferrer">
              {"\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0447\u0435\u043a \u0432 WhatsApp"}
            </a>
          )}
        </div>
      )}

      {error && <p className={scss.commonError}>{error}</p>}
    </div>
  );
};

export default CheckoutPaymentStep;

