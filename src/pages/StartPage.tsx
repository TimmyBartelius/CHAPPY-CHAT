import React from "react";
import { useNavigate } from "react-router-dom";
import { guestLogin } from "../api/auth";
import '../assets/StartPage.css';

const StartPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    const res = await guestLogin();
    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("username", res.username);
      navigate("/channels"); // t.ex. en framtida sida
    } else {
      alert("Kunde inte logga in som gäst");
    }
  };

  return (
    <div className="start">
      <h1 className="welcome">Välkommen till CHAPPY 💬</h1>
      <div className="btns">
        <button
          onClick={() => navigate("/login")}
          className="loginBtn"
        >
          Logga in
        </button>
        <button
          onClick={() => navigate("/register")}
          className="registerBtn"
        >
          Registrera dig
        </button>
        <button
          onClick={handleGuestLogin}
          className="guestBtn"
        >
          Fortsätt som gäst
        </button>
      </div>
    </div>
  );
};

export default StartPage;
