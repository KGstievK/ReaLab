export type PaymentMethod = "mbank_redirect" | "finca_qr" | "manual";

export type PaymentMethodOption = {
  id: PaymentMethod;
  provider: string;
  label: string;
  description: string;
  kind: "redirect" | "qr" | "manual";
  currency: "KGS";
  is_enabled: boolean;
  sort_order: number;
};

export const FALLBACK_PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    id: "mbank_redirect",
    provider: "mbank",
    label: "MBank",
    description: "После подтверждения заказа вы сможете завершить оплату через MBank.",
    kind: "redirect",
    currency: "KGS",
    is_enabled: true,
    sort_order: 1,
  },
  {
    id: "finca_qr",
    provider: "finca",
    label: "FINCA Bank",
    description: "Отсканируйте QR-код, оплатите и при необходимости отправьте чек в WhatsApp.",
    kind: "qr",
    currency: "KGS",
    is_enabled: true,
    sort_order: 2,
  },
];

export const isQrPaymentMethod = (
  method: PaymentMethod,
  methods: PaymentMethodOption[] = FALLBACK_PAYMENT_METHOD_OPTIONS,
) => methods.find((item) => item.id === method)?.kind === "qr";
