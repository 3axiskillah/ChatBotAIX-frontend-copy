import {
  sanitizeFormData,
  sanitizeAPIResponse,
  rateLimiter,
  CSRFProtection,
} from "./security";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;

interface ApiFetchOptions extends RequestInit {
  body?: any;
  headers?: HeadersInit;
}

// Safe cookie check that works in SSR environments too
function isAuthenticated(): boolean {
  if (typeof document === "undefined") return false; // SSR fallback
  return document.cookie.includes("access_token");
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {},
  isAIWorker = false,
  retry = true
): Promise<any> {
  // Rate limiting check
  if (!rateLimiter.canAttempt(`api_${endpoint}`, 30, 60000)) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  const url = `${isAIWorker ? AI_WORKER_URL : API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  // Sanitize request body
  let sanitizedBody = options.body;
  if (options.body && !isFormData && typeof options.body === "object") {
    sanitizedBody = sanitizeFormData(options.body);
  }

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    credentials: isAIWorker ? "omit" : "include",
    ...options,
    body: sanitizedBody,
  };

  // Add CSRF protection
  if (!isAIWorker) {
    CSRFProtection.addToHeaders(fetchOptions.headers as Headers);
  }

  // Handle JSON body
  if (options.body && !isFormData) {
    fetchOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  // Handle empty responses
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }

  // Robust response parsing
  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  let data: any;
  try {
    // First try to read as text (safer than direct .json())
    const text = await res.text();
    data = isJson && text ? JSON.parse(text) : text;
  } catch (e) {
    console.error("Response parsing failed:", e);
    data = null;
  }

  // Skip token refresh for auth endpoints and AI worker
  const isAuthEndpoint = endpoint.includes("/accounts/");
  if (
    res.status === 401 &&
    !isAIWorker &&
    retry &&
    !isAuthEndpoint &&
    isAuthenticated()
  ) {
    try {
      const refreshRes = await apiFetch(
        "/api/accounts/refresh/",
        {
          method: "POST",
        },
        false,
        false
      ); // Prevent infinite retry loops

      if (refreshRes) {
        return apiFetch(endpoint, options, isAIWorker, false); // Retry once
      }
      throw new Error("Refresh failed");
    } catch (err) {
      throw new Error("Session expired. Please log in again.");
    }
  }

  // Handle errors
  if (!res.ok) {
    const message =
      data?.detail || // Django REST Framework style
      data?.message || // Common alternative
      (typeof data === "string" ? data : res.statusText);

    throw new Error(message || `Request failed with status ${res.status}`);
  }

  // Sanitize response data
  const sanitizedData = sanitizeAPIResponse(data);
  return sanitizedData;
}
