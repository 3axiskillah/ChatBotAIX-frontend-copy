const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;

interface ApiFetchOptions extends RequestInit {
  body?: any;
  headers?: HeadersInit;
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {},
  isAIWorker = false,
  retry = true
): Promise<any> {
  const url = `${isAIWorker ? AI_WORKER_URL : API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: isAIWorker ? "omit" : "include",
    ...options,
  };

  if (options.body) {
    fetchOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  let data = null;

  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    data = null;
  }

  // ✅ Handle token expiration and auto-refresh
  if (res.status === 401 && !isAIWorker && retry) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/accounts/refresh/`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        return apiFetch(endpoint, options, isAIWorker, false);
      } else {
        throw new Error("Session expired. Please log in again.");
      }
    } catch (refreshErr) {
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const errorMessage =
      typeof data === "string"
        ? data
        : data?.message || data?.detail || res.statusText;
    throw new Error(errorMessage || `Request failed with status ${res.status}`);
  }

  return data;
}
