import React, { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";

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
  const [senderId, setSenderId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      setSenderId(decoded.userId);
    }
  }, [token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!senderId) return;
    try {
      const res = await fetch(`${API_URL}/dms/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Kunde inte hämta DMs");
      const data = await res.json();
      const sorted = data.sort(
        (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (senderId === recipientId) {
      alert("Du kan inte skicka meddelanden till dig själv!");
      return;
    }

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
    if (senderId) fetchMessages();
  }, [recipientId, senderId]);

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
            className={`dm-message ${msg.senderId === senderId ? "outgoing" : "incoming"}`}
          >
            <div className="dm-content">{msg.content}</div>
            <div className="dm-time">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {senderId !== recipientId ? (
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
      ) : (
        <div className="dm-self-warning">
          <p>Du kan inte chatta med dig själv.</p>
        </div>
      )}
    </div>
  );
};

export default DirectMessageView;
