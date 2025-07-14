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

  // Ensure body is properly serialized if present
  if (options.body) {
    fetchOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  // Attempt to parse error message if response is not ok
  if (!res.ok) {
    let errorText = await res.text();
    try {
      const errorJson = JSON.parse(errorText);
      errorText = errorJson.message || errorJson.detail || errorText;
    } catch {
      // fallback to plain text
    }
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }

  // Handle non-JSON or empty responses
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }

  return res.json();
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
