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
      "\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u0437\u0430\u043a\u0430\u0437\u0430 \u0432\u044b \u0441\u043c\u043e\u0436\u0435\u0442\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c \u043e\u043f\u043b\u0430\u0442\u0443 \u0447\u0435\u0440\u0435\u0437 MBank.",
  },
  {
    id: "finca_qr",
    label: "FINCA Bank",
    kind: "qr",
    description:
      "\u041e\u0442\u0441\u043a\u0430\u043d\u0438\u0440\u0443\u0439\u0442\u0435 QR-\u043a\u043e\u0434, \u043e\u043f\u043b\u0430\u0442\u0438\u0442\u0435 \u0438 \u043f\u0440\u0438 \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e\u0441\u0442\u0438 \u043e\u0442\u043f\u0440\u0430\u0432\u044c\u0442\u0435 \u0447\u0435\u043a \u0432 WhatsApp.",
  },
];

export const isQrPaymentMethod = (method: PaymentMethod) =>
  PAYMENT_METHOD_OPTIONS.find((item) => item.id === method)?.kind === "qr";

