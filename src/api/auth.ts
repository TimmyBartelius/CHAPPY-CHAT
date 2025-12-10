const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}

export async function register(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Registration failed");
  }
  return await res.json();
}

export async function guestLogin() {
  const res = await fetch(`${API_URL}/guest/guest`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Guest Login Failed");
  }
  return res.json();
}
