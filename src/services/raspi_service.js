// src/app/services/raspi_service.js
// Node 22+ có fetch sẵn, KHÔNG cần node-fetch

const RASPI_BASE = process.env.RASPI_BASE_URL || process.env.RASPI_URL || "";

function ensureBase() {
  if (!RASPI_BASE) {
    throw new Error("Missing RASPI_BASE_URL (or RASPI_URL) in .env");
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// remove "data:image/...;base64," if present
function stripDataUrl(dataUrlOrB64) {
  if (typeof dataUrlOrB64 !== "string") return "";
  const idx = dataUrlOrB64.indexOf("base64,");
  if (idx >= 0) return dataUrlOrB64.slice(idx + "base64,".length);
  return dataUrlOrB64;
}

async function postJson(path, bodyObj, timeoutMs = 15000) {
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

    const payload = {
      ok: res.ok,
      status: res.status,
      data: ct.includes("application/json") ? safeJson(text) : null,
      text: text?.slice(0, 800) || "",
    };

    return payload;
  } finally {
    clearTimeout(t);
  }
}

const raspiService = {
  lock: (lockerId, user) => postJson("/lock", { lockerId, user }),
  unlock: (lockerId, user) => postJson("/unlock", { lockerId, user }),

  // Raspi nhận diện: chuẩn hóa để Raspi nhận base64 thuần
  recognizeRemote: ({ imageBase64, lockerId, user }) => {
    const b64 = stripDataUrl(imageBase64);
    return postJson("/recognize-remote", {
      lockerId,
      user,
      image_data: b64, // ✅ Raspi server đọc image_data
      // vẫn gửi thêm để tương thích nếu bạn có code khác:
      imageBase64,
    });
  },

  // Raspi chụp trực tiếp (nếu USE_CAMERA = True)
  captureBatch: ({ name }) => postJson("/capture-batch", { name }),

  // Web chụp gửi lên Raspi để train
  captureRemoteBatch: ({ name, images_data }) => {
    const imgs = Array.isArray(images_data) ? images_data : [];
    const normalized = imgs.map(stripDataUrl);
    return postJson("/capture-remote-batch", { name, images_data: normalized });
  },
};

export default raspiService;
