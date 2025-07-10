// utils/api.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  isAIWorker = false
) {
  const url = isAIWorker ? `${AI_WORKER_URL}${endpoint}` : `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: isAIWorker ? "omit" : "include", // only Django uses cookies
    ...options,
  };

  if (options.body && typeof options.body !== "string") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fetch failed: ${res.status} ${errorText}`);
  }

  return res.json();
}
