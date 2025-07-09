const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const AI_WORKER_URL = import.meta.env.VITE_AI_WORKER_URL?.replace(/\/+$/, "");

export const apiFetch = async (
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: BodyInit } = {},
  useAI: boolean = false
) => {
  const baseUrl = useAI ? AI_WORKER_URL : API_BASE_URL;
  const url = `${baseUrl}/${path.replace(/^\/+/, "")}`; // ensure 1 slash only

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error ${response.status}: ${text}`);
  }

  return response.status === 204 ? null : response.json();
};
