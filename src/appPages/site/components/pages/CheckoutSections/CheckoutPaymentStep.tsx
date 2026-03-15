"use client";

import Image from "next/image";
import Mbank from "@/assets/images/Mbank.svg";
import scss from "./CheckoutSection.module.scss";
import { PaymentMethod, PaymentMethodOption, isQrPaymentMethod } from "./paymentMethods";

export type CheckoutQrItem = {
  pay_img: string;
  info: string;
  number: string;
};

type CheckoutPaymentStepProps = {
  paymentMethod: PaymentMethod;
  paymentMethods: PaymentMethodOption[];
  onChangeMethod: (method: PaymentMethod) => void;
  qrItems: CheckoutQrItem[];
  qrWhatsapp?: string;
  error?: string;
};

const CheckoutPaymentStep = ({
  paymentMethod,
  paymentMethods,
  onChangeMethod,
  qrItems,
  qrWhatsapp,
  error,
}: CheckoutPaymentStepProps) => {
  const selectedMethod =
    paymentMethods.find((item) => item.id === paymentMethod) ??
    paymentMethods[0];

  return (
    <div className={scss.section}>
      <h2>ОПЛАТИТЬ ЧЕРЕЗ:</h2>

      <div className={scss.paymentMethods}>
        {paymentMethods.map((method) => (
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

      {selectedMethod ? (
        <div className={scss.paymentInfoCard}>
          <h4>{selectedMethod.label}</h4>
          <p>{selectedMethod.description}</p>
        </div>
      ) : null}

      {selectedMethod && isQrPaymentMethod(paymentMethod, paymentMethods) && (
        <div className={scss.qrBlock}>
          <p>Оплатите по QR-коду и подтвердите оплату.</p>

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
              Отправить чек в WhatsApp
            </a>
          )}
        </div>
      )}

      {error && <p className={scss.commonError}>{error}</p>}
    </div>
  );
};

export default CheckoutPaymentStep;
