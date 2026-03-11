const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");

export const resolveMediaUrl = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;

  // Keep backend media paths relative so Next can proxy them through /media rewrite.
  if (normalizedPath.startsWith("/media/")) {
    return normalizedPath;
  }

  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};
