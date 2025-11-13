// pages/landingpage/channels.tsx
import React, { useState } from "react";
import Sidebar from "./SideBar";
import ChannelView from "./ChannelView";
import DirectMessageView from "./DirectMessageView";

interface ChannelsProps {
  activeDM: { id: string; name: string } | null;
  setActiveDM: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;
}

const ChannelsPage: React.FC<ChannelsProps> = ({ activeDM, setActiveDM }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedChannelName, setSelectedChannelName] = useState<string>("");

  
  const handleSelect = (id: string, name: string, type: "channel" | "user") => {
    if (type === "channel") {
      setSelectedChannelId(id);
      setSelectedChannelName(name);
      setActiveDM(null);
    } else if (type === "user") {
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
        ) : selectedChannelId ? (
          <ChannelView 
            channelId={selectedChannelId} 
            channelName={selectedChannelName} 
          />
        ) : (
          <p>Välj en kanal eller användare för att se meddelanden</p>
        )}
      </div>
    </div>
  );
};

export default ChannelsPage;
