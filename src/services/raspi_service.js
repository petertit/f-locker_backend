import fetch from "node-fetch";

const RASPI_URL = process.env.RASPI_URL;

if (!RASPI_URL) {
  throw new Error("❌ Missing RASPI_URL in .env");
}

export async function forwardGet(path) {
  const res = await fetch(RASPI_URL + path);
  if (!res.ok) {
    throw new Error(`Raspi GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function forwardPost(path, body = {}) {
  const res = await fetch(RASPI_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Raspi POST ${path} failed: ${text}`);
  }

  return res.json();
}
