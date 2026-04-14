const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI('AIzaSyAQvT1gU4CwRVCT0IJVDBhxVVSnfv_PFzg');
  
  console.log("Testing gemini-pro...");
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent("test");
    console.log("gemini-pro works");
  } catch (e) {
    console.error("gemini-pro failed:", e.message);
  }

  console.log("\nTesting gemini-1.5-flash...");
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("test");
    console.log("gemini-1.5-flash works");
  } catch (e) {
    console.error("gemini-1.5-flash failed:", e.message);
  }
}

listModels();
