const { GoogleGenAI } = require('@google/genai');

async function listModels() {
  const client = new GoogleGenAI({
    apiKey: 'AIzaSyAQvT1gU4CwRVCT0IJVDBhxVVSnfv_PFzg'
  });

  try {
    const response = await client.models.list();
    // In newer SDK it might be response.models or it behaves like an iterator
    console.log("Response type:", typeof response);
    const models = response.models || response;
    if (Array.isArray(models)) {
       models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
    } else {
       console.log("Response:", JSON.stringify(response, null, 2));
    }
  } catch (e) {
    console.error("List models failed:", e.message);
  }
}

listModels();
