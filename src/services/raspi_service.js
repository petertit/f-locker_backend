// src/services/raspi_service.js
// Node 18+ đã có fetch global → KHÔNG import node-fetch

const RASPI_URL = process.env.RASPI_URL;

if (!RASPI_URL) {
  throw new Error("❌ Missing RASPI_URL in environment variables");
}

async function forwardPost(path, body) {
  const res = await fetch(`${RASPI_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Raspi POST ${path} failed`);
  }

  return data;
}

async function forwardGet(path) {
  const res = await fetch(`${RASPI_URL}${path}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Raspi GET ${path} failed`);
  }

  return data;
}

export default {
  forwardPost,
  forwardGet,
};
