const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}

export async function register(username: string, password: string) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}

export async function guestLogin() {
  const res = await fetch(`${API_URL}/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return await res.json();
}
