const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;       // Django backend
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;     // AI worker

export const apiFetch = async (
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: BodyInit } = {},
  useAI: boolean = false
) => {
  const baseUrl = useAI ? AI_WORKER_URL : API_BASE_URL;

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // ✅ Give better error messages for 401/403
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  // If it's empty response (204 No Content), return null
  if (response.status === 204) return null;

  return response.json();
};
