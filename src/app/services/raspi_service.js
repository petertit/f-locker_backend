const RASPI_BASE_URL = process.env.RASPI_URL;

export async function unlockLocker(lockerId) {
  const res = await fetch(`${RASPI_BASE_URL}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lockerId }),
  });

  if (!res.ok) {
    throw new Error("Failed to unlock locker");
  }

  return res.json();
}
