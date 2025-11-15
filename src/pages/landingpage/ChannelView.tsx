// pages/landingpage/ChannelView.tsx
import React, { useEffect, useState, useRef } from "react";
import "../../assets/ChannelView.css";
import type { User } from "../../../srcServer/shared/types";

const normalizeChannelId = (id: string) =>
  id.startsWith("CHANNEL#") ? id.replace("CHANNEL#", "") : id;

interface Message {
  PK: string;
  SK: string;
  text: string;
  sender: {userId: string; username: string};
  createdAt: number;
  ttl?: number,
}

interface ChannelViewProps {
  channelId: string;
  channelName: string;
  users: User[];
  isGuest?: boolean;
}

const ChannelView: React.FC<ChannelViewProps> = ({ channelId, channelName, users, isGuest }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/channelMessages/${normalizeChannelId(channelId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Kunde inte hämta meddelanden");
      const data: Message[] = await res.json();
      const sorted = [...data].sort((a,b) => a.createdAt - b.createdAt);
      setMessages(sorted);
    } catch (err) {
      console.error("Fel vid hämtning av meddelanden:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !token) return;
    try {
      const res = await fetch(`${API_URL}/channelMessages/${normalizeChannelId(channelId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newMessage }),
      });
      if (!res.ok) throw new Error("Kunde inte skicka meddelande");
      setNewMessage("");
      await fetchMessages();
    } catch (err) {
      console.error("Fel vid skickande av meddelande:", err);
    }
  };

  useEffect(() => {
    if (channelId) fetchMessages();
  }, [channelId]);

  return (
    <div className="channel-window">
      <h2 className="channelName">Du är i kanalen: {channelName}</h2>

      <div className="channelMessages">
        {messages.map((msg) => {
          const senderName = users.find(u => u.id === msg.sender?.userId)?.username || msg.sender?.username || msg.sender?.userId ||"Okänd";
          return (
            <div key={msg.SK} className="channel-message">
              <b>{senderName}:</b> {msg.text}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="channel-input-area">
        <input
          className="channel-input"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isGuest ? "Skriv meddelande (Guest)" : "Skriv meddelande..."}
          disabled={false}
        />
        <button className="channel-send-btn" onClick={sendMessage}>
          Skicka
        </button>
      </div>
    </div>
  );
};

export default ChannelView;
