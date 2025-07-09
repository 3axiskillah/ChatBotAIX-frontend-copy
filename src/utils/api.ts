export async function apiFetch(
  url: string,
  options: RequestInit = {},
  isAIWorker = false
) {
  const base = isAIWorker
    ? import.meta.env.VITE_AI_WORKER_URL
    : import.meta.env.VITE_API_BASE_URL;

  return fetch(`${base}${url}`, {
    ...options,
    credentials: "include", // ✅ REQUIRED
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data;
    return data;
  });
}
