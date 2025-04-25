import { IncomingMessage } from "http";

export function normalizeHeaders(
  message: IncomingMessage,
  overrides?: Record<string, string | null>,
): HeadersInit {
  const result = new Headers();
  const headers = message.headers;

  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((val) => result.append(key, val));
      } else {
        result.set(key, value);
      }
    }
  });

  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null) {
        result.delete(key);
      } else {
        result.set(key, value);
      }
    });
  }

  if (message.method === "OPTIONS") {
    result.delete("Content-Length");
  }

  return result;
}
