import React, { useEffect, useState } from "react";
import type { Channel, User } from "../../../srcServer/shared/types";
import { getChannels, getUsers } from "../../api/channels";
import "../../assets/SideBar.css";
import {jwtDecode} from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface SidebarProps {
  onSelect: (id: string, name: string, type: "channel" | "user") => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  // Hämta din egen användarroll
  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setCurrentUserRole(decoded.accessLevel);
    }
  }, [token]);

  // Hämta kanaler + users
  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedChannels = await getChannels();
        setChannels(fetchedChannels.filter((c) => c.SK === "METADATA"));

        const fetchedUsers = await getUsers();
        const mapped = fetchedUsers.map((u) => ({
          PK: u.id,
          SK: "METADATA",
          username: u.username,
          accessLevel: u.accessLevel || "User",
          passwordHash: "",
          id: u.id,
        }));

        setUsers(mapped);
      } catch (err) {
        console.error("Failed to load sidebar data:", err);
      }
    };

    loadData();
  }, []);

  const handleDeleteUser = async (userPK: string) => {
    if (!userPK) return;

    try {
      const res = await fetch(
        `${API_URL}/users/me?userId=${encodeURIComponent(userPK)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Kunde inte ta bort användare!");

      setUsers((prev) => prev.filter((u) => u.PK !== userPK));
      alert("Användaren raderad!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="SidebarOnly">
      <h2>Kanaler</h2>
      <ul className="channelList">
        {channels.map((chan) => (
          <li key={chan.PK}>
            <button
              className="chanBtns"
              onClick={() => onSelect(
                chan.PK?.toString().startsWith("CHANNEL#")
                ? chan.PK.toString().replace("CHANNEL#", "")
                : chan.PK,
                chan.name,
                "channel"
              )
            }
            >
              {chan.name}
            </button>
          </li>
        ))}
      </ul>

      <h2 className="users">Användare</h2>
      <ul className="userList">
        {users.map((user) => (
          <li key={user.PK}>
            <button
              className="userBtns"
              onClick={() => onSelect(user.PK, user.username, "user")}
            >
              {user.username}
            </button>

            {currentUserRole === "Admin" && (
              <button
                className="deleteUserBtns"
                onClick={() => handleDeleteUser(user.PK)}
              >
                Ta bort användare
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
