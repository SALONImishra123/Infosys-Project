import fetch from 'node-fetch';

// Replace with your model ID and backend API URL
const MODEL_ID = '68c062663c82e5871f8406c0';
const BACKEND_URL = 'http://localhost:5000/api/model';

async function getModelDetails() {
  try {
    const response = await fetch(`${BACKEND_URL}/${MODEL_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add token if your backend requires authentication
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Model Details:', data);
  } catch (err) {
    console.error('Error fetching model details:', err.message);
  }
}

getModelDetails();
