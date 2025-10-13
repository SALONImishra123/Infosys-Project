// fetchModels.js — Node 20+ (built-in fetch)
// Replace WORKSPACE_ID if needed.

const WORKSPACE_ID = "68c124606374c1b592b53ffa";
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMxMjQ0YzYzNzRjMWI1OTJiNTNmZjMiLCJpYXQiOjE3NjAzNTQ3MzIsImV4cCI6MTc2MDk1OTUzMn0.1z5Jw3NuKthljvDYlUohQA3LMzbrLrQQBgYm3ZF_fII";
const BACKEND_URL = `http://127.0.0.1:5050/api/models/workspace/${WORKSPACE_ID}`;

async function fetchWorkspaceModels() {
  try {
    const resp = await fetch(BACKEND_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // show backend message if available
      const msg = data?.message || JSON.stringify(data) || resp.statusText;
      throw new Error(`${resp.status} ${msg}`);
    }

    const models = data.models || [];
    if (models.length === 0) {
      console.log("No models found in this workspace.");
      return;
    }

    console.log(`✅ Found ${models.length} model(s):\n`);
    models.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name || '—'}`);
      console.log(`   ID: ${m._id || '—'}`);
      console.log(`   Backend: ${m.backend || '—'}`);
      console.log(`   Status: ${m.status || '—'}`);
      const perf = m.performance || {};
      if (Object.keys(perf).length) {
        console.log('   Performance:');
        if (perf.accuracy !== undefined) console.log(`     accuracy: ${perf.accuracy}`);
        if (perf.precision !== undefined) console.log(`     precision: ${perf.precision}`);
        if (perf.recall !== undefined) console.log(`     recall: ${perf.recall}`);
        if (perf.f1Score !== undefined) console.log(`     f1Score: ${perf.f1Score}`);
        if (perf.trainingCompleted) console.log(`     trainingCompleted: ${perf.trainingCompleted}`);
      } else {
        console.log(`   Training Completed: ${m.trainingCompleted || 'N/A'}`);
      }
      console.log('---------------------------');
    });

  } catch (err) {
    console.error("❌ Error fetching models:", err.message || err);
  }
}

fetchWorkspaceModels();
