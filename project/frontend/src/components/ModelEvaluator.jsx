import React, { useState } from "react";
import axios from "axios";

export default function ModelEvaluator() {
  const [file, setFile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [confusionMatrix, setConfusionMatrix] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please upload a test set file (.csv or .json)");

    const formData = new FormData();
    formData.append("test_file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/evaluate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMetrics(res.data.metrics);
      setConfusionMatrix(res.data.confusion_matrix);
    } catch (err) {
      console.error(err);
      alert("Error while evaluating model");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded-xl max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">📊 Model Evaluation</h2>

      {/* File Upload */}
      <input type="file" accept=".csv,.json" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg"
        disabled={loading}
      >
        {loading ? "Evaluating..." : "Upload & Evaluate"}
      </button>

      {/* Metrics */}
      {metrics && (
        <div className="mt-6">
          <h3 className="font-semibold">Evaluation Metrics:</h3>
          <ul className="mt-2 space-y-1">
            {Object.entries(metrics).map(([k, v]) => (
              <li key={k}>
                <strong>{k}:</strong> {v.toFixed(4)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confusion Matrix */}
      {confusionMatrix && (
        <div className="mt-6">
          <h3 className="font-semibold">Confusion Matrix:</h3>
          <img
            src={`http://localhost:5000/${confusionMatrix}`}
            alt="Confusion Matrix"
            className="mt-2 border rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
