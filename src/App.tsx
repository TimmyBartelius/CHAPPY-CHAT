import { BrowserRouter, Routes, Route } from "react-router-dom";
import {useState} from "react";
import StartPage from "./pages/StartPage";
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import Channels from "./pages/landingpage/channels"



function App() {
  const [activeDM, setActiveDM] = useState<{id: string, name: string} | null>(null);
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/channels" 
        element={<Channels setActiveDM={setActiveDM} activeDM={activeDM} />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;