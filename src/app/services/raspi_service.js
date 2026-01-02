// src/services/raspi_service.js
// Node 18+ (Render Node 22) có global fetch => KHÔNG cần node-fetch

const RASPI_BASE = (process.env.RASPI_URL || "").replace(/\/+$/, "");

if (!RASPI_BASE) {
  console.warn("⚠️ Missing RASPI_URL in env. Raspi forward will fail.");
}

async function forward(method, path, body, extra = {}) {
  const url = `${RASPI_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = { ...(extra.headers || {}) };

  const controller = new AbortController();
  const timeoutMs = extra.timeoutMs ?? 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const opts = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body !== undefined) {
      if (!headers["Content-Type"])
        headers["Content-Type"] = "application/json";
      opts.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const res = await fetch(url, opts);

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function forwardGet(path, extra) {
  return forward("GET", path, undefined, extra);
}

export async function forwardPost(path, body, extra) {
  return forward("POST", path, body, extra);
}

// ✅ export default để controller dùng raspiService.forwardPost(...)
export default { forwardGet, forwardPost };
