// Test script for @google/genai with gemini-1.5-flash
const { GoogleGenAI } = require('@google/genai');

async function testNewSDK() {
  const client = new GoogleGenAI({
    apiKey: 'AIzaSyAQvT1gU4CwRVCT0IJVDBhxVVSnfv_PFzg'
  });

  console.log("Testing gemini-1.5-flash with new SDK...");
  try {
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    console.log("Success! Response:", response.text);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

testNewSDK();
