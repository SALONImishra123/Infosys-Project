import React from "react";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import TestModel from "./components/TestModel";
import ModelEvaluator from "./components/ModelEvaluator.jsx"; // optional, could be reused
import "./styles/global.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/test-model" element={<TestModel />} /> {/* Chat + Evaluation */}
            <Route path="/evaluate-model" element={<ModelEvaluator />} /> {/* optional separate page */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
