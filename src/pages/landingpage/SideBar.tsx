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
  const [isGuest, setIsGuest] = useState(false);
  const token = localStorage.getItem("token");

  // Hämta din egen användarroll
  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setCurrentUserRole(decoded.accessLevel);
      if (decoded.accessLevel === "Guest") setIsGuest(true);
    } else {
      setIsGuest(true);
    }
  }, [token]);

  // Hämta kanaler + users
  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedChannels = await getChannels(token || undefined);
        setChannels(fetchedChannels.filter((c) => c.SK === "METADATA"));

        const fetchedUsers = await getUsers(token || undefined);
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
  }, [token]);

  //______________FUNKTIONEN FÖR ADMIN DELETE________________
const handleDeleteUser = async (userPK: string, accessLevel: string) => {
  if (!userPK) return;

  if(isGuest){
    alert("Gäster kan inte ta bort användare!");
    return;
  }

  try {
    let url = "";
    let options: RequestInit = {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    };

    if (accessLevel === "Admin") {
      url = `${API_URL}/users/me?userId=${encodeURIComponent(userPK)}`;
    } else {
      url = `${API_URL}/users/self`;
    }

    const res = await fetch(url, options);

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Kunde inte ta bort användare!");
    }

    setUsers((prev) => prev.filter((u) => u.PK !== userPK));
    alert("Användaren raderad!");
  } catch (err) {
    console.error(err);
  }
};


  //Hämta inloggares ID
  const getCurrentUserIdFromToken = () => {
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded.userId;
  };

  const handleDeleteMe = async () => {
    if (!token || isGuest) {
      alert("Gäster kan inte radera konto");
      return;
    }
    try{
      const res = await fetch(`${API_URL}/users/me`, {
        method: "DELETE",
        headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error("Kunde inte ta bort kontot!");

      alert("Ditt konto är raderat!");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch(err) {
      console.error(err);
      alert("Kunde inte ta bort kontot");
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
              disabled={isGuest}
            >
              {user.username}
            </button>

            {currentUserRole === "Admin" && !isGuest && (
              <button
                className="deleteUserBtns"
                onClick={() => handleDeleteUser(user.PK, user.accessLevel)}
              >
                Ta bort användare
              </button>
            )}
            {user.PK === getCurrentUserIdFromToken() && !isGuest && (
                          <button          
                          className="deleteUserBtns"
                          onClick={handleDeleteMe}>
                            Radera mitt konto
                            </button>
                          )}
                          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
