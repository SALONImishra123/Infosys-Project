import fetch from 'node-fetch';

// Replace with your workspace ID
const WORKSPACE_ID = "68c05ee03c82e5871f8405fc";

// If your backend requires JWT auth, put your token here
const JWT_TOKEN = ""; // e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

async function fetchWorkspaceModels() {
  try {
    const response = await fetch(`http://localhost:5000/api/models/workspace/${WORKSPACE_ID}`, {
      headers: JWT_TOKEN ? { 'Authorization': `Bearer ${JWT_TOKEN}` } : {}
    });

    const models = await response.json();

    if (!models.length) {
      console.log("No models found in this workspace.");
      return;
    }

    console.log("Models in workspace:");
    models.forEach(model => {
      console.log(`- Name: ${model.name}`);
      console.log(`  ID: ${model._id}`);
      console.log(`  Backend: ${model.backend}`);
      console.log(`  Status: ${model.status}`);
      console.log(`  Training Completed: ${model.performance?.trainingCompleted || 'N/A'}`);
      console.log('-------------------------');
    });

  } catch (err) {
    console.error("Error fetching models:", err.message);
  }
}

fetchWorkspaceModels();
