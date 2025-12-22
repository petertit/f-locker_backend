function getBaseUrl() {
  const raw = process.env.RASPI_URL || "";
  if (!raw) throw new Error("Missing env RASPI_URL");
  return raw.replace(/\/+$/, "");
}

async function safeJson(res) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function forwardGet(path, { timeoutMs = 8000 } = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        `RASPI GET ${url} failed: HTTP ${res.status} - ${
          data?.error || data?.message || JSON.stringify(data) || "No body"
        }`
      );
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

export async function forwardPost(path, body, { timeoutMs = 10000 } = {}) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        `RASPI POST ${url} failed: HTTP ${res.status} - ${
          data?.error || data?.message || JSON.stringify(data) || "No body"
        }`
      );
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}
