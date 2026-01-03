// src/app/services/raspi_service.js
// Node 22+ có fetch sẵn, KHÔNG cần node-fetch

const RASPI_BASE = process.env.RASPI_BASE_URL || process.env.RASPI_URL || "";

// timeouts (ms)
const TIMEOUT = {
  LOCK: 15000,
  UNLOCK: 15000,
  RECOGNIZE: 15000,
  CAPTURE_TRAIN: 120000, // ✅ train lâu -> phải dài
};

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

async function postJson(path, bodyObj, timeoutMs) {
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

    const data = ct.includes("application/json") ? safeJson(text) : null;

    const payload = {
      ok: res.ok,
      status: res.status,
      data,
      text: text?.slice(0, 1200) || "",
      url,
    };

    // ✅ IMPORTANT: nếu Raspi trả lỗi -> throw để controller bắt & trả đúng
    if (!res.ok) {
      const msg =
        data?.error ||
        data?.message ||
        payload.text ||
        `Raspi HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  } catch (e) {
    // ✅ phân biệt timeout abort
    if (e?.name === "AbortError") {
      const err = new Error(
        `Raspi request timeout after ${timeoutMs}ms (path: ${path})`
      );
      err.status = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

const raspiService = {
  lock: (lockerId, user) => postJson("/lock", { lockerId, user }, TIMEOUT.LOCK),

  unlock: (lockerId, user) =>
    postJson("/unlock", { lockerId, user }, TIMEOUT.UNLOCK),

  // Raspi nhận diện: chuẩn hóa để Raspi nhận base64 thuần
  recognizeRemote: ({ imageBase64, lockerId, user }) => {
    const b64 = stripDataUrl(imageBase64);
    return postJson(
      "/recognize-remote",
      {
        lockerId,
        user,
        image_data: b64, // ✅ Raspi server đọc image_data
        // giữ thêm để tương thích nếu code cũ còn dùng:
        imageBase64,
      },
      TIMEOUT.RECOGNIZE
    );
  },

  // Raspi chụp trực tiếp (nếu USE_CAMERA = True)
  captureBatch: ({ name, count = 5, lockerId = null }) =>
    postJson(
      "/capture-batch",
      { name, count, ...(lockerId ? { lockerId } : {}) },
      TIMEOUT.CAPTURE_TRAIN
    ),

  // Web chụp gửi lên Raspi để train
  captureRemoteBatch: ({ name, images_data, lockerId = null }) => {
    const imgs = Array.isArray(images_data) ? images_data : [];
    const normalized = imgs.map(stripDataUrl);

    return postJson(
      "/capture-remote-batch",
      {
        name,
        images_data: normalized,
        ...(lockerId ? { lockerId } : {}),
      },
      TIMEOUT.CAPTURE_TRAIN
    );
  },
};

export default raspiService;
