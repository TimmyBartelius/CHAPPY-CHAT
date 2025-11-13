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

  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setCurrentUserRole(decoded.accessLevel); 
    }
  }, [token]);

useEffect(() => {
  const fetchData = async () => {
    try {
      const fetchedChannels = await getChannels();
      setChannels(fetchedChannels.filter(c => c.SK === "METADATA"));
      const fetchedUsers = await getUsers();
      const mappedUsers: User[] = fetchedUsers.map(u => ({
        PK: u.id,
        SK: "METADATA",
        username: u.username,
        accessLevel: u.accessLevel || "User",
        passwordHash: u.passwordHash || "",
        id: u.id,
      }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to fetch channels or users:", err);
    }
  };
  fetchData();
}, []);

  const handleDeleteUser = async (userPK: string) => {
    if (!userPK) return alert("Ingen userId angiven!");
    const actualId = userPK;

    try {
      const res = await fetch(`${API_URL}/users/me?userId=${encodeURIComponent(actualId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Kunde inte ta bort användaren!");
      alert("Användaren raderad!");
      setUsers(prev => prev.filter(u => u.PK !== userPK));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="SidebarOnly">
      <h2>Kanaler</h2>
      <ul className="channelList">
        {channels.map(chan => (
          <li key={chan.PK}>
            <button
              className="chanBtns"
              onClick={() => onSelect(chan.PK, chan.name, "channel")}
            >
              {chan.name}
            </button>
          </li>
        ))}
      </ul>

      <h2 className="users">Användare</h2>
      <ul className="userList">
        {users.map(user => (
          <li key={user.PK}>
            <button
              className="userBtns" onClick={() => onSelect(user.id, user.username, "user")}>
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
