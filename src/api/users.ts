// api/users.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getUsers(): Promise<string[]> {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  // Returnera bara användarnamn
  return data.map((user: any) => user.username);
}
