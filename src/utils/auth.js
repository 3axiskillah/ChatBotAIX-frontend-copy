// auth.js
import { apiFetch } from "./api";

export async function loginUser(email, password) {
  return await apiFetch("/api/accounts/login/", {
    method: "POST",
    body: { email, password },
  });
}

export async function registerUser(email, password) {
  return await apiFetch("/api/accounts/register/", {
    method: "POST",
    body: { email, password },
  });
}

export async function refreshToken() {
  try {
    await apiFetch("/api/accounts/refresh/", {
      method: "POST",
    });
    console.log("Token refreshed");
    return true;
  } catch (err) {
    console.error("Refresh failed:", err);
    return false;
  }
}
