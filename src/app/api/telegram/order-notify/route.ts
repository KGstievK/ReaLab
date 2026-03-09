import { NextRequest, NextResponse } from "next/server";

const MAX_ITEMS = 25;
const MAX_PHOTOS_PER_ITEM = 5;
const MAX_TEXT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 3500;

type OrderItem = {
  name: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  photos: string[];
};

type OrderNotifyPayload = {
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
  items: OrderItem[];
};

const normalizeText = (value: unknown, max = MAX_TEXT_LENGTH): string => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
};

const normalizeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
};

const normalizeMoney = (value: unknown, max = 32): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value, max);
};

const formatMoney = (value: string): string => {
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return value;
  }

  return `${parsed.toLocaleString("ru-RU")} с`;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const parseItem = (value: unknown): OrderItem | null => {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<OrderItem>;

  const name = normalizeText(item.name);
  const colorName = normalizeText(item.colorName, 40);
  const size = normalizeText(item.size, 20);
  const unitPrice = normalizeMoney(item.unitPrice, 32);
  const lineTotal = normalizeMoney(item.lineTotal, 32);
  const quantity = normalizeNumber(item.quantity);

  if (!name || !colorName || !size || !unitPrice || !lineTotal || quantity === null || quantity < 1) {
    return null;
  }

  const photos = Array.isArray(item.photos)
    ? item.photos
        .map((photo) => normalizeText(photo, 1024))
        .filter(Boolean)
        .slice(0, MAX_PHOTOS_PER_ITEM)
    : [];

  return {
    name,
    colorName,
    size,
    quantity,
    unitPrice,
    lineTotal,
    photos,
  };
};

const parsePayload = (value: unknown): OrderNotifyPayload | null => {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<OrderNotifyPayload>;

  const firstName = normalizeText(payload.firstName);
  const phoneNumber = normalizeText(payload.phoneNumber, 32);
  const city = normalizeText(payload.city);
  const address = normalizeText(payload.address, 255);
  const delivery = normalizeText(payload.delivery, 50);
  const paymentMethod = normalizeText(payload.paymentMethod, 50);
  const subtotal = normalizeMoney(payload.subtotal, 32);
  const deliveryPrice = normalizeMoney(payload.deliveryPrice, 32);
  const discountPrice = normalizeMoney(payload.discountPrice, 32);
  const totalToPay = normalizeMoney(payload.totalToPay, 32);
  const orderUser = normalizeNumber(payload.orderUser);

  if (
    !firstName ||
    !phoneNumber ||
    !city ||
    !address ||
    !delivery ||
    !paymentMethod ||
    !subtotal ||
    !deliveryPrice ||
    !discountPrice ||
    !totalToPay ||
    orderUser === null
  ) {
    return null;
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > MAX_ITEMS) {
    return null;
  }

  const items = payload.items
    .map((item) => parseItem(item))
    .filter((item): item is OrderItem => item !== null);

  if (!items.length || items.length !== payload.items.length) {
    return null;
  }

  return {
    firstName,
    phoneNumber,
    city,
    address,
    delivery,
    paymentMethod,
    orderUser,
    subtotal,
    deliveryPrice,
    discountPrice,
    totalToPay,
    items,
  };
};

const buildMessage = (payload: OrderNotifyPayload): string => {
  const lines: string[] = [];
  lines.push("Новый заказ");
  lines.push("");
  lines.push("Покупатель:");
  lines.push(`Имя: ${payload.firstName}`);
  lines.push(`Телефон: ${payload.phoneNumber}`);
  lines.push(`Город: ${payload.city}`);
  lines.push(`Адрес: ${payload.address}`);
  lines.push(`Способ доставки: ${payload.delivery}`);
  lines.push(`Способ оплаты: ${payload.paymentMethod}`);
  lines.push("");
  lines.push("Состав заказа:");

  payload.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`Цвет: ${item.colorName}`);
    lines.push(`Размер: ${item.size}`);
    lines.push(`Количество: ${item.quantity} шт.`);
    lines.push(`Цена за 1 шт.: ${formatMoney(item.unitPrice)}`);
    lines.push(`Сумма: ${formatMoney(item.lineTotal)}`);
    lines.push("");
  });

  lines.push("Итого:");
  lines.push(`Товары: ${formatMoney(payload.subtotal)}`);
  lines.push(`Доставка: ${formatMoney(payload.deliveryPrice)}`);
  lines.push(`Скидка: -${formatMoney(payload.discountPrice)}`);
  lines.push(`К оплате: ${formatMoney(payload.totalToPay)}`);

  return lines.join("\n").slice(0, MAX_MESSAGE_LENGTH);
};

const extractBearerToken = (request: NextRequest): string | null => {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;

  const token = header.slice(7).trim();
  return token || null;
};

const getApiBaseUrl = (): string | null => {
  const value = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!value) return null;
  return value.replace(/\/+$/, "");
};

const resolvePhotoUrl = (photo: string, candidates: string[]): string | null => {
  if (isHttpUrl(photo)) {
    return photo;
  }

  for (const base of candidates) {
    try {
      return new URL(photo, base).toString();
    } catch {
      // Try next candidate.
    }
  }

  return null;
};

const getFileNameFromUrl = (url: string, fallback: string): string => {
  try {
    const parsed = new URL(url);
    const name = parsed.pathname.split("/").filter(Boolean).pop();
    return name || fallback;
  } catch {
    return fallback;
  }
};

const sendTelegramPhotoByUrl = async ({
  baseUrl,
  chatId,
  photoUrl,
  caption,
}: {
  baseUrl: string;
  chatId: string;
  photoUrl: string;
  caption?: string;
}): Promise<boolean> => {
  const response = await fetch(`${baseUrl}/sendPhoto`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
    }),
  });

  return response.ok;
};

const sendTelegramPhotoByUpload = async ({
  baseUrl,
  chatId,
  photoUrl,
  caption,
  fallbackName,
}: {
  baseUrl: string;
  chatId: string;
  photoUrl: string;
  caption?: string;
  fallbackName: string;
}): Promise<boolean> => {
  let imageResponse: Response;
  try {
    imageResponse = await fetch(photoUrl, { cache: "no-store" });
  } catch {
    return false;
  }

  if (!imageResponse.ok) {
    return false;
  }

  const contentType = imageResponse.headers.get("content-type") || "application/octet-stream";
  const fileName = getFileNameFromUrl(photoUrl, fallbackName);
  const imageBytes = await imageResponse.arrayBuffer();

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("photo", new Blob([imageBytes], { type: contentType }), fileName);
  if (caption) {
    formData.append("caption", caption);
  }

  const uploadResponse = await fetch(`${baseUrl}/sendPhoto`, {
    method: "POST",
    body: formData,
  });

  return uploadResponse.ok;
};

const resolveAuthorizedUserId = async (request: NextRequest): Promise<number | null> => {
  const token = extractBearerToken(request);
  const apiBaseUrl = getApiBaseUrl();
  if (!token || !apiBaseUrl) return null;

  try {
    const profileResponse = await fetch(`${apiBaseUrl}/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) return null;

    const body = (await profileResponse.json()) as unknown;
    const profile = Array.isArray(body) ? body[0] : body;
    const userId = Number((profile as { id?: unknown })?.id);

    if (!Number.isInteger(userId) || userId < 1) return null;
    return userId;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !telegramChatId) {
    return NextResponse.json(
      { ok: false, message: "Telegram is not configured" },
      { status: 503 },
    );
  }

  const authorizedUserId = await resolveAuthorizedUserId(request);
  if (!authorizedUserId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const payload = parsePayload(rawPayload);
  if (!payload) {
    return NextResponse.json(
      { ok: false, message: "Invalid payload structure" },
      { status: 400 },
    );
  }

  if (payload.orderUser !== authorizedUserId) {
    return NextResponse.json(
      { ok: false, message: "Forbidden for this user" },
      { status: 403 },
    );
  }

  const baseUrl = `https://api.telegram.org/bot${telegramToken}`;
  const apiBaseUrl = getApiBaseUrl();
  let apiOrigin: string | null = null;

  if (apiBaseUrl) {
    try {
      apiOrigin = new URL(apiBaseUrl).origin;
    } catch {
      apiOrigin = null;
    }
  }

  const baseCandidates = Array.from(
    new Set(
      [request.nextUrl.origin, apiBaseUrl, apiOrigin].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );

  let sendMessageResponse: Response;
  try {
    sendMessageResponse = await fetch(`${baseUrl}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: buildMessage(payload),
      }),
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to send telegram message" },
      { status: 502 },
    );
  }

  if (!sendMessageResponse.ok) {
    return NextResponse.json(
      { ok: false, message: "Failed to send telegram message" },
      { status: 502 },
    );
  }

  for (const item of payload.items) {
    for (const [index, photo] of item.photos.entries()) {
      const resolvedPhoto = resolvePhotoUrl(photo, baseCandidates);
      if (!resolvedPhoto) continue;

      const caption =
        index === 0
          ? `Фото товара: ${item.name}\nЦвет: ${item.colorName}\nКоличество: ${item.quantity} шт.`
          : undefined;

      const sentByUrl = await sendTelegramPhotoByUrl({
        baseUrl,
        chatId: telegramChatId,
        photoUrl: resolvedPhoto,
        caption,
      });

      if (sentByUrl) {
        continue;
      }

      await sendTelegramPhotoByUpload({
        baseUrl,
        chatId: telegramChatId,
        photoUrl: resolvedPhoto,
        caption,
        fallbackName: `product-${item.name}-${index + 1}.jpg`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
