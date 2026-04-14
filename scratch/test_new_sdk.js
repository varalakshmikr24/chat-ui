// Test script for @google/genai
const { GoogleGenAI } = require('@google/genai');

async function testNewSDK() {
  const client = new GoogleGenAI({
    apiKey: 'AIzaSyAQvT1gU4CwRVCT0IJVDBhxVVSnfv_PFzg'
  });

  console.log("Testing gemini-2.0-flash with new SDK...");
  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    // The response structure might be different (e.g. response.text vs response.candidates[0].content.parts[0].text)
    // According to migration guide it's response.text
    console.log("Success! Response:", response.text);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

testNewSDK();
