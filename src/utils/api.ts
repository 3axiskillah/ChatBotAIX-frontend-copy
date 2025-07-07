const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;       // Django backend
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL;     // AI worker

export const apiFetch = async (
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: BodyInit } = {},
  useAI: boolean = false
) => {
  const baseUrl = useAI ? AI_WORKER_URL : API_BASE_URL;

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
};
