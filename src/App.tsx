import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import Channels from "./pages/landingpage/channels"

function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/channels" element={<Channels />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;