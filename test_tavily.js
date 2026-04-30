const { tavily } = require("@tavily/core");
require('dotenv').config({ path: '.env.local' });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
tvly.search("weather in bengaluru").then(console.log).catch(console.error);
