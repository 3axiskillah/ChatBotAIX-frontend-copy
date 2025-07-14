const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;

interface ApiFetchOptions extends RequestInit {
  body?: any;
  headers?: HeadersInit;
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {},
  isAIWorker = false
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

  if (!res.ok) {
    const errorMessage =
      typeof data === "string"
        ? data
        : data?.message || data?.detail || res.statusText;
    throw new Error(errorMessage || `Request failed with status ${res.status}`);
  }

  return data;
}

// Helper methods
export const api = {
  get: (endpoint: string, options: ApiFetchOptions = {}, isAIWorker = false) =>
    apiFetch(endpoint, { ...options, method: "GET" }, isAIWorker),

  post: (endpoint: string, body: any, options: ApiFetchOptions = {}, isAIWorker = false) =>
    apiFetch(endpoint, { ...options, method: "POST", body }, isAIWorker),

  put: (endpoint: string, body: any, options: ApiFetchOptions = {}, isAIWorker = false) =>
    apiFetch(endpoint, { ...options, method: "PUT", body }, isAIWorker),

  patch: (endpoint: string, body: any, options: ApiFetchOptions = {}, isAIWorker = false) =>
    apiFetch(endpoint, { ...options, method: "PATCH", body }, isAIWorker),

  delete: (endpoint: string, options: ApiFetchOptions = {}, isAIWorker = false) =>
    apiFetch(endpoint, { ...options, method: "DELETE" }, isAIWorker),
};
