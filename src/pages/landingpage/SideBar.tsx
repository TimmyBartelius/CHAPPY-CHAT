import React, { useEffect, useState } from "react";
import type { Channel, User } from "../../../srcServer/shared/types";
import { getChannels, getUsers } from "../../api/channels";
import "../../assets/SideBar.css";
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface SidebarProps {
  onSelect: (id: string, name: string, type: "channel" | "user") => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelVisibility, setNewChannelVisibility] = useState<"public" | "private">("public");
  const token = localStorage.getItem("token");

  // --- Hämta användarroll ---
  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setCurrentUserRole(decoded.accessLevel);
      if (decoded.accessLevel === "Guest") setIsGuest(true);
    } else {
      setIsGuest(true);
    }
  }, [token]);

  // --- Hämta kanaler och användare ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedChannels = await getChannels(token || undefined);
        setChannels(
          fetchedChannels.filter(c=> c.SK === "METADATA"));

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
  }, [token, isGuest]);

  const getCurrentUserIdFromToken = () => {
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded.userId;
  };

  // --- Skapa kanal ---
  const handleCreateChannel = async () => {
    if (!token || isGuest) {
      alert("Gäster kan inte skapa kanaler.");
      return;
    }
    if (!newChannelName.trim()) {
      alert("Ange ett kanalnamn!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName: newChannelName,
          isLocked: newChannelVisibility === "private",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Kunde inte skapa kanal");
      }

      const createdChannel = await res.json();
      setChannels((prev) => [...prev, createdChannel]);
      setNewChannelName("");
      alert("Kanal skapad!");
    } catch (err) {
      console.error(err);
      alert("Kunde inte skapa kanal!");
    }
  };

  // --- Ta bort kanal ---
  const handleDeleteChannel = async (id: string, creatorId?: string) => {
    if (!token || isGuest) {
      alert("Gäster kan inte ta bort kanaler");
      return;
    }
    if (currentUserRole === "User" && creatorId !== getCurrentUserIdFromToken()) {
      alert("Du kan bara ta bort dina egna kanaler");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/channels/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Kunde inte ta bort kanal");
      }

      // Filtrera bort korrekt kanal från state
      setChannels((prev) =>
        prev.filter((c) => {
          const cId = c.PK.toString().startsWith("CHANNEL#")
            ? c.PK.toString().replace("CHANNEL#", "")
            : c.PK;
          return cId !== id;
        })
      );

      alert("Kanal borttagen!");
    } catch (err) {
      console.error(err);
      alert("Kunde inte ta bort kanal");
    }
  };

  // --- Ta bort användare ---
  const handleDeleteUser = async (userPK: string, accessLevel: string) => {
    if (!userPK || isGuest) {
      alert("Gäster kan inte ta bort användare!");
      return;
    }

    try {
      let url = "";
      const options: RequestInit = { method: "DELETE", headers: { Authorization: `Bearer ${token}` } };
      if (accessLevel === "Admin") url = `${API_URL}/users/me?userId=${encodeURIComponent(userPK)}`;
      else url = `${API_URL}/users/self`;

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

  const handleDeleteMe = async () => {
    if (!token || isGuest) {
      alert("Gäster kan inte radera konto");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Kunde inte ta bort kontot!");
      alert("Ditt konto är raderat!");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      alert("Kunde inte ta bort kontot");
    }
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    if (isGuest) {
      localStorage.clear();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("accessLevel");
    }
    window.location.href = "/";
  };

  return (
    <div className="SidebarOnly">
      <h2>Kanaler</h2>
      <p>Skapa ny kanal:</p>
      {!isGuest && (
        <div className="create-channel">
          <input className="createInputChan"
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Nytt kanalnamn"
          />
          <select className="createInputChoice"
            value={newChannelVisibility}
            onChange={(e) => setNewChannelVisibility(e.target.value as "public" | "private")}
          >
            <option value="public">Öppen</option>
            <option value="private">Privat</option>
          </select>
          <button className="createChanBtn" onClick={handleCreateChannel}>
            Skapa Kanal
          </button>
        </div>
      )}
      <p>Öppna och låsta kanaler:</p>
      <ul className="channelList">
        {channels.map((chan) => (
          <li className="chanInList" key={chan.PK}>
            <button
              className="chanBtns"
              onClick={() => onSelect(chan.PK, chan.name, "channel")}
            >
              {chan.name} {chan.isLocked ? "🔒" : ""}
            </button>

            {!isGuest &&
              (currentUserRole === "Admin" || (currentUserRole === "User" && chan.creatorId === getCurrentUserIdFromToken())) && (
                <button
                  className="channelDelBtn"
                  onClick={() => {
                    const id = chan.PK.toString().startsWith("CHANNEL#")
                      ? chan.PK.toString().replace("CHANNEL#", "")
                      : chan.PK;
                    handleDeleteChannel(id, chan.creatorId);
                  }}
                >
                  Ta bort Kanal
                </button>
              )}
          </li>
        ))}
      </ul>

      <h2 className="users">Användare</h2>
      <ul className="userList">
        {users.map((user) => (
          <li className="userListItem" key={user.PK}>
            <button
              className="userBtns"
              onClick={() => onSelect(user.PK, user.username, "user")}
              disabled={isGuest}
            >
              {user.username}
            </button>

            {currentUserRole === "Admin" && !isGuest && (
              <button className="deleteUserBtns" onClick={() => handleDeleteUser(user.PK, user.accessLevel)}>
                Ta bort användare
              </button>
            )}

            {user.PK === getCurrentUserIdFromToken() && !isGuest && (
              <button className="deleteUserBtns" onClick={handleDeleteMe}>
                Radera mitt konto
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="logoutHandle">
        <button className="logoutBtn" onClick={handleLogout}>
          Logga ut
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
