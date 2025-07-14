import { apiFetch } from "./api";

export async function fetchCurrentUser() {
  try {
    const data = await apiFetch("/api/auth/me/", {
      credentials: "include",
    });
    return data;
  } catch {
    return null;
  }
}

export async function loginUser(email, password) {
  const res = await apiFetch(
    "/api/auth/login/",
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ email, password }),
    }
  );
  return res;
}

export async function logoutUser() {
  await apiFetch("/api/auth/logout/", {
    method: "POST",
    credentials: "include",
  });
}

export async function refreshToken() {
  try {
    const res = await apiFetch("/api/accounts/refresh/", {
      method: "POST",
      credentials: "include",
    });
    console.log("Token refreshed");
    return true;
  } catch (e) {
    console.error("Refresh failed", e);
    return false;
  }
}
