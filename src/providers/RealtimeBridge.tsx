"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { api } from "../redux/api";
import {
  AUTH_STORAGE_CHANGED_EVENT,
  getStoredAccessToken,
} from "../utils/authStorage";

type RealtimePayload = {
  type?: string;
  entity?: string;
  entityId?: number;
  payload?: Record<string, unknown>;
};

const RealtimeBridge = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    const handleAuthChanged = () => {
      setAuthVersion((prev) => prev + 1);
    };

    window.addEventListener(AUTH_STORAGE_CHANGED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener(AUTH_STORAGE_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

  const shouldUseAdminStream = useMemo(() => pathname.startsWith("/admin"), [pathname]);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      return;
    }

    const connections: EventSource[] = [];

    const invalidate = (...tags: Array<"admin" | "category" | "product" | "review">) => {
      dispatch(api.util.invalidateTags(tags as never));
    };

    const handlePayload = (payload: RealtimePayload) => {
      switch (payload.type) {
        case "catalog_changed":
          invalidate("category", "product");
          break;
        case "content_changed":
          invalidate("category", "product");
          break;
        case "favorite_changed":
          invalidate("category");
          break;
        case "cart_changed":
          invalidate("product");
          break;
        case "order_created":
        case "order_status_changed":
          invalidate("product", "admin");
          break;
        case "comment_created":
          invalidate("category", "review");
          break;
        case "admin_order_changed":
        case "admin_catalog_changed":
        case "admin_content_changed":
        case "admin_comment_changed":
          invalidate("admin", "category", "product");
          break;
        default:
          break;
      }
    };

    const connect = (scope: "public" | "user" | "admin", token?: string) => {
      const url = new URL("/events/stream/", baseUrl);
      url.searchParams.set("scope", scope);
      if (token) {
        url.searchParams.set("token", token);
      }

      const source = new EventSource(url.toString());
      source.onmessage = (event) => {
        if (!event.data) {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as RealtimePayload;
          if (payload.type === "ping") {
            return;
          }

          handlePayload(payload);
        } catch {
          // Ignore malformed events and keep the stream alive.
        }
      };
      connections.push(source);
    };

    connect("public");

    const token = getStoredAccessToken();
    if (token) {
      connect("user", token);
      if (shouldUseAdminStream) {
        connect("admin", token);
      }
    }

    return () => {
      connections.forEach((source) => source.close());
    };
  }, [authVersion, dispatch, shouldUseAdminStream]);

  return null;
};

export default RealtimeBridge;
