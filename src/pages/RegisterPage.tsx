import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import '../assets/RegisterPage.css';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte!");
      return;
    }

    const res = await register(username, password);

    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("username", res.username);
      navigate("/channels"); // eller din main-view
    } else {
      setError(res.error || "Något gick fel vid registrering");
    }
  };

  return (
    <div>
      <h1 className="overhead-text">Registrera konto</h1>

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
        <input
          type="password"
          placeholder="Bekräfta lösenord"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="confirm-password"
        />

        {error && <p className="errMsg">{error}</p>}

        <button
          type="submit"
          className="submitBtn"
        >
          Skapa konto
        </button>
      </form>

      <p className="Acc">
        Har du redan ett konto?{" "}
        <button
          onClick={() => navigate("/login")}
          className="loginBtn"
        >
          Logga in
        </button>
      </p>
    </div>
  );
};

export default RegisterPage;
