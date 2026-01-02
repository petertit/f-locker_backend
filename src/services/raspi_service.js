// src/services/raspi_service.js
// Node 18+ (Node 22 Render) có sẵn fetch/FormData/Blob

const DEFAULT_TIMEOUT_MS = 15000;

function joinUrl(base, path) {
  if (!base) return null;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function readAsJsonOrText(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    const json = await res.json().catch(() => null);
    return { kind: "json", data: json };
  }
  const text = await res.text().catch(() => "");
  return { kind: "text", data: text };
}

/**
 * Forward image to Raspi server for recognition.
 * - multipart/form-data with field name: image
 * - try multiple endpoints to avoid 404/405 mismatch
 */
export async function recognizeRemoteOnRaspi({
  raspiBaseUrl,
  buffer,
  mimetype = "image/jpeg",
  filename = "frame.jpg",
  lockerId = null,
  userEmail = null,
}) {
  if (!raspiBaseUrl) throw new Error("Missing RASPI_URL");
  if (!buffer || !Buffer.isBuffer(buffer))
    throw new Error("Missing image buffer");

  // ✅ Bạn chỉnh thêm/bớt theo API Raspi thật của bạn.
  // Lỗi 405 thường do đúng path nhưng Raspi không cho POST => thử path khác.
  const candidatePaths = [
    "/recognize-remote",
    "/recognize_remote",
    "/recognize",
    "/face/recognize",
    "/api/recognize",
    "/api/recognize-remote",
    "/raspi/recognize",
    "/raspi/recognize-remote",
  ];

  const buildForm = () => {
    const fd = new FormData();
    const blob = new Blob([buffer], { type: mimetype });
    fd.append("image", blob, filename);
    if (lockerId) fd.append("lockerId", String(lockerId));
    if (userEmail) fd.append("user", String(userEmail));
    return fd;
  };

  let lastErr = null;

  for (const p of candidatePaths) {
    const url = joinUrl(raspiBaseUrl, p);
    try {
      const fd = buildForm();
      const res = await fetchWithTimeout(url, {
        method: "POST",
        body: fd,
        // ❌ không set Content-Type cho FormData
      });

      const payload = await readAsJsonOrText(res);

      if (!res.ok) {
        const snippet =
          payload.kind === "text"
            ? String(payload.data || "").slice(0, 180)
            : JSON.stringify(payload.data || {}).slice(0, 180);

        lastErr = new Error(
          `Raspi ${p} failed: HTTP ${res.status} - ${snippet}`
        );
        continue;
      }

      return { ok: true, path: p, payload };
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Raspi recognize failed (unknown)");
}
