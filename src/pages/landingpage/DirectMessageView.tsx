import React, { useEffect, useState, useRef } from "react";
import "../../assets/DirectMessageView.css"

interface Message {
  PK: string;
  SK: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
}

interface DirectMessageViewProps {
  recipientId: string;
  recipientName: string;
}

const DirectMessageView: React.FC<DirectMessageViewProps> = ({ recipientId, recipientName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/dms/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Kunde inte hämta DMs");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`${API_URL}/dms/${recipientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error("Kunde inte skicka DM");
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="dm-window">
      <div className="dm-header">
        <h2>DM med {recipientName}</h2>
      </div>

      <div className="dm-messages">
        {messages.map((msg) => (
          <div
            key={msg.SK}
            className={`dm-message ${msg.senderId === recipientId ? "incoming" : "outgoing"}`}
          >
            <div className="dm-content">{msg.content}</div>
            <div className="dm-time">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="dm-input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv ett meddelande..."
          className="dm-input"
        />
        <button onClick={sendMessage} className="dm-send-btn">Skicka</button>
      </div>
    </div>
  );
};

export default DirectMessageView;
