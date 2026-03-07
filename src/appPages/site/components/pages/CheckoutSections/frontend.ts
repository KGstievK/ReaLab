import { getStoredAccessToken } from "@/utils/authStorage";

export type TelegramNotifyPayload = {
  firstName: string;
  phoneNumber: string;
  city: string;
  address: string;
  delivery: string;
  orderUser: number;
  totalPrice: string;
  items: Array<{
    name: string;
    color: number;
    size: string;
    quantity: number;
    unitPrice: string;
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

