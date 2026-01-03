// Node 18+/22+ có fetch sẵn
const RASPI_BASE = process.env.RASPI_BASE_URL || process.env.RASPI_URL || "";

function ensureBase() {
  if (!RASPI_BASE)
    throw new Error("Missing RASPI_BASE_URL (or RASPI_URL) in .env");
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requestJson(method, path, bodyObj, timeoutMs = 15000) {
  ensureBase();

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const url = `${RASPI_BASE}${path.startsWith("/") ? path : `/${path}`}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: bodyObj ? JSON.stringify(bodyObj) : undefined,
      signal: ctrl.signal,
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");

    const data = ct.includes("application/json") ? safeJson(text) : null;

    return {
      ok: res.ok,
      status: res.status,
      data,
      text: text?.slice(0, 800) || "",
    };
  } finally {
    clearTimeout(t);
  }
}

const raspiService = {
  status: () => requestJson("GET", "/status", null),

  lock: (lockerId, user) => requestJson("POST", "/lock", { lockerId, user }),
  unlock: (lockerId, user) =>
    requestJson("POST", "/unlock", { lockerId, user }),

  // ✅ Raspi expects: { image_data: "<pure base64>" }
  recognizeRemote: ({ image_data, lockerId, user }) =>
    requestJson("POST", "/recognize-remote", { image_data, lockerId, user }),

  // ✅ Raspi expects: { name, images_data:[...pure base64...] }
  captureRemoteBatch: ({ name, images_data, lockerId, user }) =>
    requestJson("POST", "/capture-remote-batch", {
      name,
      images_data,
      lockerId,
      user,
    }),

  // optional raspi cam mode
  captureBatch: ({ name, lockerId, user }) =>
    requestJson("POST", "/capture-batch", { name, lockerId, user }),
};

export default raspiService;
