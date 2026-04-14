const { GoogleGenAI } = require('@google/genai');

async function testModels() {
  const client = new GoogleGenAI({
    apiKey: 'AIzaSyAQvT1gU4CwRVCT0IJVDBhxVVSnfv_PFzg'
  });

  const models = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-pro-latest'
  ];

  for (const m of models) {
    console.log(`Testing ${m}...`);
    try {
      const response = await client.models.generateContent({
        model: m,
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
      });
      console.log(`${m}: SUCCESS`);
      // If we find a working one, we're good
      // return m;
    } catch (e) {
      console.log(`${m}: FAILED - ${e.message}`);
    }
  }
}

testModels();
