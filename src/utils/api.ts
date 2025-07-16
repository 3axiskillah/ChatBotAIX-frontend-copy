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

  if (options.body && !isFormData) {
    fetchOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);

  // ================== CRITICAL CHANGES START HERE ================== //
  
  // 1. Handle empty responses (204 No Content)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }

  // 2. More robust content-type checking
  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  let data: any;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch (e) {
    console.error("Response parsing failed, but continuing:", e);
    data = null;
  }

  // 3. Skip token refresh for auth-related endpoints
  const isAuthEndpoint = endpoint.includes("/accounts/");
  if (res.status === 401 && !isAIWorker && retry && !isAuthEndpoint && isAuthenticated()) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/accounts/refresh/`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        return apiFetch(endpoint, options, isAIWorker, false);
      }
    } catch (err) {
      /* empty */
    }
  }

  // 4. Improved error message extraction
  if (!res.ok) {
    const message = 
      data?.detail ||              // Django REST Framework style
      data?.message ||            // Common alternative
      (typeof data === "string" ? data : res.statusText);
    
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  // ================== CHANGES END HERE ================== //

  return data;
}
