// Node.js v20+ has fetch built-in, no import needed

const testText = "I want to fly to Paris";

async function testRasaModel() {
  try {
    const response = await fetch("http://localhost:5000/model/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: testText }),
    });

    const data = await response.json();
    console.log("Prediction Result:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

testRasaModel();
