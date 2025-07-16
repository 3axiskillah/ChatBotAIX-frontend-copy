const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;

interface ApiFetchOptions extends RequestInit {
  body?: any;
  headers?: HeadersInit;
}

function isAuthenticated(): boolean {
  return document.cookie.includes("access_token");
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {},
  isAIWorker = false,
  retry = true
): Promise<any> {
  const url = `${isAIWorker ? AI_WORKER_URL : API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    credentials: isAIWorker ? "omit" : "include",
    ...options,
  };

  // Handle JSON body
  if (options.body && !isFormData) {
    fetchOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  //  Critical Change: Handle empty responses (begin change)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null; // No content to parse
  }
  // End change

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  let data: any = null;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch (e) {
    data = null;
  }

  // 🔁 Try refreshing access token if unauthorized
  //being change
  const isAuthEndpoint = endpoint.includes("/accounts/");
  //end change
  if (res.status === 401 && !isAIWorker && retry && isAuthenticated()) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/accounts/refresh/`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        return apiFetch(endpoint, options, isAIWorker, false); // Retry once
      } else {
        // Clear session (optionally) or redirect
        throw new Error("Session expired. Please log in again.");
      }
    } catch (err) {
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.detail || res.statusText;
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  return data;
}
