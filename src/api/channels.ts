// frontend/api/channels.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
import type { Channel, User } from "../../srcServer/shared/types";

export async function getChannels(token?: string): Promise<Channel[]> {
  const res = await fetch(`${API_URL}/channels`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Failed to fetch channels");
  return res.json() as Promise<Channel[]>;
}

export async function getUsers(token?: string): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<User[]>;
}
