const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
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
  const res = await fetch(`${API_URL}/auth/guest`, {
    method: "POST",
  });
  return res.json();
}
