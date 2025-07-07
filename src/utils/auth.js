export async function fetchCurrentUser() {
  const res = await fetch("http://localhost:8000/api/auth/me/", {
    credentials: "include", // IMPORTANT: allow cookies
  });

  if (res.ok) {
    const data = await res.json();
    return data; // includes user info like email, is_premium, etc
  } else {
    return null;
  }
}

export async function loginUser(email, password) {
  const res = await fetch("http://localhost:8000/api/auth/login/", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Invalid login credentials");

  return await res.json(); // Contains tokens, but we're storing them in cookies
}

export async function logoutUser() {
  await fetch("http://localhost:8000/api/auth/logout/", {
    method: "POST",
    credentials: "include",
  });
}

async function refreshToken() {
  try {
    const res = await fetch("http://localhost:8000/api/accounts/token/refresh/", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      console.log("Token refreshed");
      return true;
    }
  } catch (e) {
    console.error("Refresh failed", e);
  }
  return false;
}