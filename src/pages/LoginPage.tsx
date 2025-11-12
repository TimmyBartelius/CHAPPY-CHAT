import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await login(username, password);

    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("username", res.username);
      navigate("/channels"); // Du kan ändra till din huvudvy
    } else {
      setError(res.error || "Fel användarnamn eller lösenord");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Logga in</h1>

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

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium"
        >
          Logga in
        </button>
      </form>

      <p className="mt-4 text-sm">
        Har du inget konto?{" "}
        <button
          onClick={() => navigate("/register")}
          className="text-blue-400 hover:underline"
        >
          Registrera dig här
        </button>
      </p>
    </div>
  );
};

export default LoginPage;
