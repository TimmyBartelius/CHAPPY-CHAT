import React, { useState } from "react";
import Sidebar from "./SideBar";
import ChannelView from "./ChannelView";

const ChannelsPage: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedChannelName, setSelectedChannelName] = useState<string>("");

  const handleSelect = (id: string, name: string, type: "channel" | "user") => {
    if (type === "channel") {
      setSelectedChannelId(id);
      setSelectedChannelName(name);
    }
  };

  return (
    <div>
      <Sidebar onSelect={handleSelect} />
      <div style={{ marginLeft: "20px", flex: 1 }}>
        {selectedChannelId ? (
          <ChannelView channelId={selectedChannelId} channelName={selectedChannelName}/>
        ) : (
          <p>Välj en kanal för att se meddelanden</p>
        )}
      </div>
    </div>
  );
};

export default ChannelsPage;

