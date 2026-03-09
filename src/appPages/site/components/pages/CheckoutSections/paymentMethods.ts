export type PaymentMethod = "mbank_redirect" | "finca_qr";

type PaymentMethodKind = "redirect" | "qr";

export type PaymentMethodOption = {
  id: PaymentMethod;
  label: string;
  kind: PaymentMethodKind;
  description: string;
};

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    id: "mbank_redirect",
    label: "MBank",
    kind: "redirect",
    description:
      "После подтверждения заказа вы сможете завершить оплату через MBank.",
  },
  {
    id: "finca_qr",
    label: "FINCA Bank",
    kind: "qr",
    description:
      "Отсканируйте QR-код, оплатите и при необходимости отправьте чек в WhatsApp.",
  },
];

export const isQrPaymentMethod = (method: PaymentMethod) =>
  PAYMENT_METHOD_OPTIONS.find((item) => item.id === method)?.kind === "qr";


