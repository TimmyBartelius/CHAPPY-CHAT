import React, { useState, useEffect } from "react";
import Sidebar from "./SideBar";
import ChannelView from "./ChannelView";
import DirectMessageView from "./DirectMessageView";
import type { User } from "../../../srcServer/shared/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface ChannelsPageProps {
  activeDM: { id: string; name: string } | null;
  setActiveDM: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;
}

const ChannelsPage: React.FC<ChannelsPageProps> = ({ activeDM, setActiveDM }) => {
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [selectedChannelName, setSelectedChannelName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const token = localStorage.getItem("token");

  // Hämta users EN gång
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Kunde inte hämta users");
        const data: User[] = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Fel vid hämtning av users:", err);
      }
    };
    fetchUsers();
  }, [token]);

  const handleSelect = (id: string, name: string, type: "channel" | "user") => {
    if (type === "channel") {
      setSelectedChannelId(id);
      setSelectedChannelName(name);
      setActiveDM(null);
    } else {
      setActiveDM({ id, name });
      setSelectedChannelId("");
      setSelectedChannelName("");
    }
  };

  return (
    <div className="Sidebar">
      <Sidebar onSelect={handleSelect} />

      <div className="messages">
        {activeDM ? (
          <DirectMessageView
            recipientId={activeDM.id}
            recipientName={activeDM.name}
          />
        ) : selectedChannelId && users.length > 0 ? (
          <ChannelView
            channelId={selectedChannelId}
            channelName={selectedChannelName}
            users={users}
          />
        ) : (
          <p>Välj en kanal eller användare för att se meddelanden</p>
        )}
      </div>
    </div>
  );
};

export default ChannelsPage;
