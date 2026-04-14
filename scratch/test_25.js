const { GoogleGenAI } = require('@google/genai');

async function test25() {
  const client = new GoogleGenAI({
    apiKey: 'AIzaSyAQvT1gU4CwRVCT0IJVDBhxVVSnfv_PFzg'
  });

  console.log("Testing gemini-2.5-flash...");
  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    console.log("Success! Response:", response.text);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

test25();
