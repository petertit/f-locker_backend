// src/services/raspi_service.js
// Node 18+ (Render Node v22) có fetch built-in => KHÔNG cần node-fetch

const RASPI_BASE = process.env.RASPI_URL;

function ensureBase() {
  if (!RASPI_BASE) throw new Error("Missing RASPI_URL in .env");
}

function joinUrl(path = "") {
  ensureBase();
  const base = String(RASPI_BASE).replace(/\/+$/, "");
  const p = String(path).startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function parseResponse(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  const text = await res.text();
  // nếu Raspi trả HTML/error text thì vẫn trả về dạng object cho dễ debug
  return { raw: text };
}

export async function forwardGet(path) {
  const url = joinUrl(path);
  const res = await fetch(url, { method: "GET" });
  const data = await parseResponse(res);

  if (!res.ok) {
    const msg =
      data?.error || data?.message || `Raspi GET failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function forwardPost(path, body = {}) {
  const url = joinUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await parseResponse(res);

  if (!res.ok) {
    const msg =
      data?.error || data?.message || `Raspi POST failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ✅ để kiểu import nào cũng chạy:
// import raspiService from "../services/raspi_service.js"
// hoặc import * as raspiService ...
export default { forwardGet, forwardPost };
