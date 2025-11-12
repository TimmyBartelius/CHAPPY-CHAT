import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, guestLogin } from "../api/auth";
import '../assets/LoginPage.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ----- Hantera vanlig login -----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validera tomma fält
    if (!username || !password) {
      setError("Ange både användarnamn och lösenord");
      return;
    }

    try {
      const res = await login(username, password);

      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("username", res.username);
        localStorage.setItem("accessLevel", res.accessLevel);

        navigate("/channels");
      } 
    } catch (err) {
      setError("Något gick fel vid login");
      console.error(err);
    }
  };

  // ----- Hantera gäst-login -----
  const handleGuestLogin = async () => {
    setError("");
    try {
      const res = await guestLogin();
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("username", res.username);
        localStorage.setItem("accessLevel", "Guest");

        navigate("/channels");
      } else {
        setError(res.error || "Kunde inte logga in som gäst");
      }
    } catch (err) {
      setError("Något gick fel vid gästlogin");
      console.error(err);
    }
  };

  return (
    <div className="login">
      <h1 className="overhead-text">Logga in</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Användarnamn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="username"
        />
        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="password"
        />

        {error && <p className="errorMsg">{error}</p>}

        <button type="submit" className="submitBtn">Logga in</button>
      </form>

      <div className="othBtns">
      <button onClick={handleGuestLogin} className="guestBtn">
        Logga in som gäst
      </button>

      <p className="noAcc">
        Har du inget konto?{" "}
        <button
          onClick={() => navigate("/register")}
          className="registerBtn">
          Registrera dig här
        </button>
      </p>
      </div>
    </div>
  );
};

export default LoginPage;

