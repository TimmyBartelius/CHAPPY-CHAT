import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";

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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Registrera konto</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <input
          type="text"
          placeholder="Användarnamn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-3 rounded bg-gray-800 border border-gray-700"
        />
        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded bg-gray-800 border border-gray-700"
        />
        <input
          type="password"
          placeholder="Bekräfta lösenord"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="p-3 rounded bg-gray-800 border border-gray-700"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 py-2 rounded font-medium"
        >
          Skapa konto
        </button>
      </form>

      <p className="mt-4 text-sm">
        Har du redan ett konto?{" "}
        <button
          onClick={() => navigate("/login")}
          className="text-blue-400 hover:underline"
        >
          Logga in här
        </button>
      </p>
    </div>
  );
};

export default RegisterPage;
