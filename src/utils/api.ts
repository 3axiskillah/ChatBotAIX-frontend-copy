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
  isAIWorker = false
): Promise<any> {
  const url = `${isAIWorker ? AI_WORKER_URL : API_BASE_URL}${endpoint}`;

  // 1. Force GET if no method specified (safer defaults)
  const method = options.method || "GET";
  
  // 2. Simplified header handling
  const headers = new Headers({
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  });

  // 3. Stringify body only if it exists and isn't already a string
  let body: BodyInit | null = null;
  if (options.body) {
    body = typeof options.body === "string" 
      ? options.body 
      : options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body);
  }

  // 4. Essential fetch call with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: isAIWorker ? "omit" : "include",
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeout);

    // 5. Absolutely bulletproof response handling
    if (res.status === 204) return null; // No Content
    
    const clone = res.clone(); // Clone for safe fallback
    let data: any;

    try {
      data = await res.json();
    } catch (jsonError) {
      console.warn("JSON parse failed, trying text:", jsonError);
      try {
        data = await clone.text();
        if (data === "") data = null;
      } catch (textError) {
        console.error("Complete response parse failure:", textError);
        data = null;
      }
    }

    // 6. Explicit success/failure handling
    if (!res.ok) {
      const message = data?.detail || data?.message || 
                     (typeof data === "string" ? data : res.statusText);
      throw new Error(message || `HTTP ${res.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error) {
      // 7. Special handling for fetch errors
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
    throw new Error("Unknown fetch error");
  }
}
