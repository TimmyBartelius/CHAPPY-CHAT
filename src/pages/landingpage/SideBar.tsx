import React, { useEffect, useState } from "react";
import type { Channel, User } from "../../../srcServer/shared/types";
import { getChannels, getUsers } from "../../api/channels";
import "../../assets/SideBar.css"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface SidebarProps {
  onSelect: (id:string, name: string, type: "channel" | "user") => void 
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const fetchChannels = async () => {
    const res = await fetch(`${API_URL}/channels`);
    const data = await res.json();
    setChannels(data.map((c:any) => ({
      id: c.id,
      name: c.name
    })));
  }

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedChannels = await getChannels();
        setChannels(fetchedChannels);

        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Failed to fetch channels or users:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="SidebarOnly">
      <h2>Kanaler</h2>
      <ul className="channelList">
        {channels.map((chan) => (
          <li key={chan.id}>
            <button onClick={() => onSelect(chan.id, chan.name, "channel")}>
              {chan.name}
            </button>
          </li>
        ))}
      </ul>

      <h2 className="users">Användare</h2>
      <ul className="userList">
        {users.map((user) => (
          <li key={user.id}>
            <button onClick={() => onSelect(user.id, user.username, "user")}>
              {user.username}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
