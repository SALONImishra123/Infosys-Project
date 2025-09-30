import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./TestModel.css";

const TestModel = () => {
  const { token } = useAuth();
  const [inputText, setInputText] = useState("");
  const [responses, setResponses] = useState([]);
  const [metrics, setMetrics] = useState(null);

  // --- Send message to chatbot ---
  const handleSend = async () => {
    if (!inputText.trim() || !token) return;

    try {
      const res = await axios.post(
        "http://localhost:5050/api/models/predict",
        { text: inputText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const reply = res.data.reply || "❌ Prediction failed";
      setResponses(prev => [...prev, { text: inputText, reply }]);
      setInputText("");
    } catch (err) {
      console.error(err);
      setResponses(prev => [...prev, { text: inputText, reply: "❌ Prediction failed" }]);
      setInputText("");
    }
  };

  // --- Fetch metrics ---
  const fetchMetrics = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5050/api/models/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetrics(res.data);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  // Fetch metrics on mount and whenever token changes
  useEffect(() => {
    fetchMetrics();
  }, [token]);

  return (
    <div className="test-model">
      {/* Chat Window */}
      <div className="chat-window">
        {responses.map((msg, idx) => (
          <div key={idx} className="chat-message">
            <div className="user-msg">You: {msg.text}</div>
            <div className="bot-msg">Bot: {msg.reply}</div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>

      {/* Evaluation Dashboard */}
      <div className="evaluation-dashboard">
        <h3>Model Evaluation</h3>

        {/* Confusion Matrix */}
        <div className="confusion-matrix">
          <h4>Confusion Matrix</h4>
          <img
            src="http://localhost:5050/api/confusion-matrix"
            alt="Confusion Matrix"
            style={{ maxWidth: "600px", height: "auto" }}
          />
        </div>

        {/* Metrics Table */}
        {metrics && (
          <div className="metrics-table">
            <h4>Evaluation Metrics</h4>
            <table>
              <tbody>
                {Object.entries(metrics).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{typeof value === "number" ? value.toFixed(4) : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestModel;
