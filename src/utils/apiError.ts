const readMessage = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = readMessage(item);
      if (nested) {
        return nested;
      }
    }
  }

  if (value && typeof value === "object") {
    if ("message" in value) {
      return readMessage((value as { message?: unknown }).message);
    }
  }

  return null;
};

export type ApiErrorInfo = {
  code: string | null;
  message: string;
  fields: Record<string, string>;
  traceId: string | null;
  status: number | string | null;
  retryAfterSeconds: number | null;
};

const toRetryAfterSeconds = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.ceil(parsed);
};

export const formatRetryAfter = (seconds: number | null): string | null => {
  if (!seconds || seconds <= 0) {
    return null;
  }

  if (seconds < 60) {
    return `${seconds} c.`;
  }

  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  if (restSeconds === 0) {
    return `${minutes} мин.`;
  }

  return `${minutes} мин. ${restSeconds} c.`;
};

export const getRateLimitAwareMessage = (
  error: Pick<ApiErrorInfo, "code" | "status" | "message" | "retryAfterSeconds">,
  fallbackMessage = "Слишком много запросов. Попробуйте позже.",
): string => {
  if (error.code !== "RATE_LIMITED" && error.status !== 429) {
    return error.message;
  }

  const waitLabel = formatRetryAfter(error.retryAfterSeconds);
  if (!waitLabel) {
    return fallbackMessage;
  }

  return `${fallbackMessage} Повторите через ${waitLabel}`;
};

export const extractApiErrorInfo = (
  error: unknown,
  fallbackMessage = "Не удалось выполнить запрос",
): ApiErrorInfo => {
  const source = error as {
    status?: unknown;
    data?: {
      code?: unknown;
      message?: unknown;
      fields?: unknown;
      traceId?: unknown;
      retryAfterSeconds?: unknown;
    };
    message?: unknown;
  };

  const payload = source?.data;
  const message =
    readMessage(payload?.message) ?? readMessage(source?.message) ?? fallbackMessage;

  const fields =
    payload?.fields && typeof payload.fields === "object" && !Array.isArray(payload.fields)
      ? Object.fromEntries(
          Object.entries(payload.fields as Record<string, unknown>).flatMap(([key, value]) => {
            const parsed = readMessage(value);
            return parsed ? [[key, parsed]] : [];
          }),
        )
      : {};

  return {
    code: typeof payload?.code === "string" ? payload.code : null,
    message,
    fields,
    traceId: typeof payload?.traceId === "string" ? payload.traceId : null,
    status:
      typeof source?.status === "number" || typeof source?.status === "string"
        ? source.status
        : null,
    retryAfterSeconds: toRetryAfterSeconds(payload?.retryAfterSeconds),
  };
};
