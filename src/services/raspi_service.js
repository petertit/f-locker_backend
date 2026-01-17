// src/app/services/raspi_service.js

const RASPI_BASE = process.env.RASPI_BASE_URL || process.env.RASPI_URL || "";

const TIMEOUT = {
  LOCK: 15000,
  UNLOCK: 15000,
  RECOGNIZE: 15000,
  CAPTURE_TRAIN: 120000,
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
    if (e?.name === "AbortError") {
      const err = new Error(
        `Raspi request timeout after ${timeoutMs}ms (path: ${path})`,
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

  recognizeRemote: ({ imageBase64, lockerId, user }) => {
    const b64 = stripDataUrl(imageBase64);
    return postJson(
      "/recognize-remote",
      {
        lockerId,
        user,
        image_data: b64,
        imageBase64,
      },
      TIMEOUT.RECOGNIZE,
    );
  },

  captureBatch: ({ name, count = 5, lockerId = null }) =>
    postJson(
      "/capture-batch",
      { name, count, ...(lockerId ? { lockerId } : {}) },
      TIMEOUT.CAPTURE_TRAIN,
    ),

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
      TIMEOUT.CAPTURE_TRAIN,
    );
  },
};

export default raspiService;
