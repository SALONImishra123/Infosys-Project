import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // make sure this provides { token }
import "./TestModel.css";

const TestModel = () => {
  const { token } = useAuth(); // Get auth token
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [confusionMatrix, setConfusionMatrix] = useState(null);

  // Send user message
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post(
        "/api/chat/predict",
        { text: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const botMsg = { sender: "bot", text: res.data.response || "Sorry, I didn't understand that." };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const botMsg = { sender: "bot", text: "Server error. Please try again later." };
      setMessages((prev) => [...prev, botMsg]);
    }
    setInput("");
    setLoading(false);
  };

  // Download model
  const downloadModel = async (modelId) => {
    try {
      const res = await axios.get(`/api/models/export/model/${modelId}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `model_${modelId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      alert("Model not found or server error!");
    }
  };

  // Download predictions
  const downloadPredictions = async (version) => {
    try {
      const res = await axios.get(`/api/models/export/predictions/${version}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `predictions_${version}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download predictions error:", err);
      alert("Predictions not found or server error!");
    }
  };

  // Fetch metrics and confusion matrix on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get("/api/models/metrics/latest", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMetrics(res.data.metrics);
        setConfusionMatrix(res.data.confusionMatrix);
      } catch (err) {
        console.error("Metrics fetch error:", err);
      }
    };

    fetchMetrics();
  }, [token]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ border: "1px solid #ccc", padding: "10px", minHeight: "300px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong> {msg.text}
          </div>
        ))}
        {loading && <div>Bot is typing...</div>}
      </div>

      <div style={{ display: "flex", marginTop: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: "5px" }}
        />
        <button onClick={sendMessage} style={{ marginLeft: "5px" }}>
          Send
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => downloadModel("68ddd8ecc9949e2e07a59f1b")}>
          Download Model
        </button>
        <button onClick={() => downloadPredictions("3")} style={{ marginLeft: "10px" }}>
          Download Predictions
        </button>
      </div>

      {metrics && (
        <div style={{ marginTop: "20px" }}>
          <h3>Latest Metrics</h3>
          <p>Accuracy: {metrics.accuracy}</p>
          <p>Precision: {metrics.precision}</p>
          <p>Recall: {metrics.recall}</p>
          <p>F1-Score: {metrics.f1}</p>
        </div>
      )}

      {confusionMatrix && (
        <div style={{ marginTop: "20px" }}>
          <h3>Confusion Matrix</h3>
          <pre>{JSON.stringify(confusionMatrix, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestModel;
