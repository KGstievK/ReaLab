import { getStoredAccessToken } from "@/utils/authStorage";

export type TelegramNotifyPayload = {
  firstName: string;
  phoneNumber: string;
  city: string;
  address: string;
  delivery: string;
  paymentMethod: string;
  orderUser: number;
  subtotal: string;
  deliveryPrice: string;
  discountPrice: string;
  totalToPay: string;
  items: Array<{
    name: string;
    colorName: string;
    size: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    photos: string[];
  }>;
};

export const notifyTelegramFrontend = async (
  payload: TelegramNotifyPayload,
) => {
  try {
    const accessToken = getStoredAccessToken();
    if (!accessToken) return;

    await fetch("/api/telegram/order-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Telegram notification failed:", error);
  }
};
