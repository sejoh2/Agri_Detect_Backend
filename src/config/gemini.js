const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure Gemini model for plant disease analysis
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.2, // Lower temperature for more consistent results
    topK: 32,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
});

module.exports = { genAI, model };