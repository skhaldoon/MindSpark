import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/landingpage";
import AboutPage from "./components/AboutPage";
import ChatPage from "./components/ChatPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/chat" element={<ChatPage />} />

      </Routes>
    </Router>
  );
}

export default App;
