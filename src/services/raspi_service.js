// Node 22+ có fetch sẵn, KHÔNG cần node-fetch
const RASPI_BASE = process.env.RASPI_BASE_URL || process.env.RASPI_URL || "";

function ensureBase() {
  if (!RASPI_BASE) {
    throw new Error("Missing RASPI_BASE_URL (or RASPI_URL) in .env");
  }
}

async function postJson(path, bodyObj, timeoutMs = 12000) {
  ensureBase();

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const url = `${RASPI_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj || {}),
      signal: ctrl.signal,
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");

    // Raspi đôi khi trả HTML lỗi -> vẫn trả về text để debug
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: ct.includes("application/json") ? safeJson(text) : null,
        text: text?.slice(0, 500) || "",
      };
    }

    return {
      ok: true,
      status: res.status,
      data: ct.includes("application/json") ? safeJson(text) : null,
      text: text?.slice(0, 500) || "",
    };
  } finally {
    clearTimeout(t);
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ===== Public API =====
const raspiService = {
  lock: (lockerId, user) => postJson("/lock", { lockerId, user }),
  unlock: (lockerId, user) => postJson("/unlock", { lockerId, user }),

  // Raspi nhận diện: bạn có thể đổi endpoint nếu raspi của bạn dùng đường khác
  // Ưu tiên JSON base64 để không cần multer/form-data
  recognizeRemote: ({ imageBase64, lockerId, user }) =>
    postJson("/recognize-remote", { imageBase64, lockerId, user }),
};

export default raspiService;
