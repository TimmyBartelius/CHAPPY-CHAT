// frontend/api/channels.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
import type { Channel, User } from "../../srcServer/shared/types";

export async function getChannels(): Promise<Channel[]> {
  const res = await fetch(`${API_URL}/channels`);
  if (!res.ok) throw new Error("Failed to fetch channels");
  const data = await res.json() as Channel[];
  return data;
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json() as User[];
  return data;
}
