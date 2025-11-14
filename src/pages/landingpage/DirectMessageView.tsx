import React, { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import "../../assets/DirectMessageView.css";

interface Message {
  PK: string;
  SK: string;
  content: string;
  senderId: string;
  senderName: string;
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
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token = localStorage.getItem("token");
  
  const getDmPK = (userA: string, userB: string) => {
    const [a, b] = [userA, userB].sort();
    return `DM#${a}#${b}`;
  }

  // Hämta användarinfo från token
  useEffect(() => {
    if (!token) return;
    const decoded: any = jwtDecode(token);
    setSenderId(decoded.userId);
    setCurrentUserName(decoded.username);
  }, [token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Hämta meddelanden för DM mellan två användare
  const fetchMessages = async () => {
    if (!senderId) return;
    const dmPK= getDmPK(senderId!, recipientId);
    const res = await fetch(`${API_URL}/dms/${encodeURIComponent(dmPK)}`, {
    headers: { Authorization: `Bearer ${token}` },
      });
    try {
      if (!res.ok) throw new Error("Kunde inte hämta DMs");
      const data = await res.json();
      const sorted = data
        .map((msg: any) => ({
          ...msg,
          senderName: msg.senderName || msg.senderId 
        }))
        .sort(
          (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      setMessages(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  // Skicka nytt meddelande
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (senderId === recipientId) {
      alert("Du kan inte skicka meddelanden till dig själv!");
      return;
    }

    try {
      const dmPK = getDmPK(senderId!, recipientId);
      const res = await fetch(`${API_URL}/dms/${encodeURIComponent(dmPK)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          content: newMessage, 
          senderName: currentUserName 
        }),
      });

      if (!res.ok) throw new Error("Kunde inte skicka DM");

      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  // Uppdatera meddelanden när recipientId eller senderId ändras
  useEffect(() => {
    if (senderId) fetchMessages();
  }, [recipientId, senderId]);

  // Scrolla automatiskt till botten när meddelanden uppdateras
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
            className={`dm-message ${msg.senderName === currentUserName ? "outgoing" : "incoming"}`}
          >
            <div className="dm-sender">{msg.senderName}</div>
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

