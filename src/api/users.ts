// api/users.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getUsers(): Promise<string[]> {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.map((user: any) => user.username);
}

export async function deleteMe(token:string) {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer${token}`,
    },
  });
  if(!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || `Failed to delete user`);
  }
  return res.json();
}