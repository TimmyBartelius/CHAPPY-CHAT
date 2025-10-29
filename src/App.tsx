import { Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h1>Start!</h1>} />
        <Route path="/about" element={<h1>Om sidan</h1>} />
      </Routes>
    </>
  );
}

export default App;