// src/services/raspi_service.js
// Node 22+ có fetch sẵn, KHÔNG cần node-fetch

const RASPI_BASE = process.env.RASPI_BASE_URL || process.env.RASPI_URL || "";

function ensureBase() {
  if (!RASPI_BASE) {
    throw new Error("Missing RASPI_BASE_URL (or RASPI_URL) in .env");
  }
}

function normalizePath(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requestJson(method, path, bodyObj, timeoutMs = 12000) {
  ensureBase();

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const url = `${RASPI_BASE}${normalizePath(path)}`;

    const init = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
    };

    if (method !== "GET") {
      init.body = JSON.stringify(bodyObj || {});
    }

    const res = await fetch(url, init);

    const ct = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");

    const payload = {
      ok: res.ok,
      status: res.status,
      data: ct.includes("application/json") ? safeJson(text) : null,
      text: text?.slice(0, 500) || "",
    };

    return payload;
  } finally {
    clearTimeout(t);
  }
}

async function getJson(path, timeoutMs = 8000) {
  return requestJson("GET", path, null, timeoutMs);
}

async function postJson(path, bodyObj, timeoutMs = 12000) {
  return requestJson("POST", path, bodyObj, timeoutMs);
}

const raspiService = {
  // optional: check raspi alive
  status: () => getJson("/status"),

  // alias
  ping: () => getJson("/status"),

  lock: (lockerId, user) => postJson("/lock", { lockerId, user }),
  unlock: (lockerId, user) => postJson("/unlock", { lockerId, user }),

  // Raspi nhận diện (JSON base64)
  recognizeRemote: ({ imageBase64, lockerId, user }) =>
    postJson("/recognize-remote", { imageBase64, lockerId, user }),

  // ✅ NEW: chụp 1 ảnh (nếu Raspi hỗ trợ)
  captureRemote: ({ lockerId, user }) =>
    postJson("/capture-remote", { lockerId, user }),

  // ✅ NEW: chụp batch N ảnh để đăng ký khuôn mặt
  // dùng đúng UI "0/5" => count mặc định 5
  captureRemoteBatch: ({ count = 5, lockerId, user }) =>
    postJson("/capture-remote-batch", { count, lockerId, user }, 20000),
};

export default raspiService;
