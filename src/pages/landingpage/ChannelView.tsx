import React, { useEffect, useState } from "react";
import "../../assets/ChannelView.css";

interface Message {
  PK: string;
  SK: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ChannelViewProps {
  channelId: string;
  channelName: string;
}

const ChannelView: React.FC<ChannelViewProps> = ({ channelId, channelName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  // ---- Hämta alla meddelanden i kanalen ----
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/${channelId}`);
      if (!res.ok) throw new Error("Kunde inte hämta meddelanden");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Fel vid hämtning av meddelanden:", err);
    }
  };

  // ---- Skicka nytt meddelande ----
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`${API_URL}/messages/${channelId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error("Kunde inte skicka meddelande");

      setNewMessage("");
      fetchMessages(); // uppdatera listan
    } catch (err) {
      console.error("Fel vid skickande av meddelande:", err);
    }
  };

  // ---- Kör vid kanalbyte ----
  useEffect(() => {
    if (channelId) fetchMessages();
  }, [channelId]);

  return (
    <div className="window">
      <h2 className="channelName">{channelName}</h2>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.SK}>
            <b>{msg.senderId}:</b> {msg.content}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Skriv meddelande..."
      />
      <button onClick={sendMessage}>Skicka</button>
    </div>
  );
};

export default ChannelView;
