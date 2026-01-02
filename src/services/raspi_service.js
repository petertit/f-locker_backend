// src/services/raspi_service.js
// Dùng fetch/FormData/Blob có sẵn trong Node 18+ (Node 22 OK)
// Không dùng node-fetch, form-data

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function safeReadJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default class RaspiService {
  constructor(baseUrl) {
    this.baseUrl =
      baseUrl || process.env.RASPI_BASE_URL || process.env.RASPI_URL || ""; // BẮT BUỘC set env này trỏ tới Raspi API
  }

  assertBaseUrl() {
    if (!this.baseUrl) {
      throw new Error(
        "Missing RASPI_BASE_URL (or RASPI_URL). Please set it to your Raspberry Pi API base URL."
      );
    }
  }

  async forwardJson(path, payload, { timeoutMs = 8000, method = "POST" } = {}) {
    this.assertBaseUrl();

    const url = joinUrl(this.baseUrl, path);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
        signal: ctrl.signal,
      });

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const json = ct.includes("application/json")
        ? await safeReadJson(res)
        : null;
      const text = json ? "" : await safeReadText(res);

      return {
        ok: res.ok,
        status: res.status,
        json,
        text,
        url,
      };
    } finally {
      clearTimeout(t);
    }
  }

  async forwardFormData(
    path,
    formData,
    { timeoutMs = 12000, method = "POST" } = {}
  ) {
    this.assertBaseUrl();

    const url = joinUrl(this.baseUrl, path);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        body: formData, // KHÔNG set Content-Type
        signal: ctrl.signal,
      });

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const json = ct.includes("application/json")
        ? await safeReadJson(res)
        : null;
      const text = json ? "" : await safeReadText(res);

      return {
        ok: res.ok,
        status: res.status,
        json,
        text,
        url,
      };
    } finally {
      clearTimeout(t);
    }
  }
}
