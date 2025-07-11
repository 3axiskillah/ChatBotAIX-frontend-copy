const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;

interface ApiFetchOptions extends RequestInit {
  body?: any;
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {},
  isAIWorker = false
): Promise<any> {
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
    credentials: isAIWorker ? "omit" : "include",
    ...options,
  };

  if (options.body) {
    fetchOptions.body =
      typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    let errorText = await res.text();
    try {
      // Try to parse error as JSON
      const errorJson = JSON.parse(errorText);
      errorText = errorJson.message || errorJson.detail || errorText;
    } catch {
      // If not JSON, use as-is
    }
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }

  // Handle empty response
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }

  return res.json();
}

// Helper methods for common HTTP verbs
export const api = {
  get: (endpoint: string, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, { ...options, method: "GET" }),
  post: (endpoint: string, body: any, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, { ...options, method: "POST", body }),
  put: (endpoint: string, body: any, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint: string, body: any, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint: string, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, { ...options, method: "DELETE" }),
};