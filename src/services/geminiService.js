const { model } = require('../config/gemini');
const axios = require('axios');

class GeminiService {
  // Analyze image for plant disease
  async analyzeImage(imageBuffer, mimeType) {
    try {
      const prompt = `You are an expert plant pathologist and agricultural scientist. Analyze this plant image and provide a detailed diagnosis. 

IMPORTANT: Your response MUST be in valid JSON format exactly as shown below. Do not include any other text, markdown, or explanations outside the JSON.

{
  "status": "ANALYSIS COMPLETE",
  "progress": 100,
  "checklist": [
    { "label": "Image quality", "isCompleted": true },
    { "label": "Leaf detection", "isCompleted": true },
    { "label": "Pathogen scan", "isCompleted": true },
    { "label": "Data verified", "isCompleted": true }
  ],
  "alert": {
    "title": "CRITICAL ALERT or WARNING or INFO based on severity",
    "diseaseName": "Full name of the detected disease/pest/nutrient deficiency",
    "description": "Detailed description of the disease including symptoms and risks",
    "severity": "critical" or "warning" or "info"
  },
  "treatmentPlan": {
    "steps": [
      {
        "title": "Step title (e.g., Immediate Action, Organic Treatment, Prevention)",
        "description": "Detailed instructions for this step"
      }
    ]
  }
}

Base your diagnosis on visual symptoms in the image. If no disease is detected, indicate the plant appears healthy with appropriate alert.`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      // Extract JSON from response (remove any markdown or extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Invalid response format from Gemini:', responseText);
        throw new Error('Invalid response format from Gemini');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      throw error;
    }
  }

  // Analyze text description
  async analyzeText(description) {
    try {
      const prompt = `You are an expert plant pathologist and agricultural scientist. Analyze this plant symptom description and provide a detailed diagnosis.

Symptom description: "${description}"

IMPORTANT: Your response MUST be in valid JSON format exactly as shown below. Do not include any other text, markdown, or explanations outside the JSON.

{
  "status": "ANALYSIS COMPLETE",
  "progress": 100,
  "checklist": [
    { "label": "Symptom analysis complete", "isCompleted": true },
    { "label": "Database search finished", "isCompleted": true },
    { "label": "Results verified", "isCompleted": true }
  ],
  "alert": {
    "title": "CRITICAL ALERT or WARNING or INFO based on severity",
    "diseaseName": "Full name of the detected disease/pest/nutrient deficiency",
    "description": "Detailed description based on the symptoms provided",
    "severity": "critical" or "warning" or "info"
  },
  "treatmentPlan": {
    "steps": [
      {
        "title": "Step title (e.g., Immediate Action, Organic Treatment, Prevention)",
        "description": "Detailed instructions for this step"
      }
    ]
  }
}

Base your diagnosis on the described symptoms. If symptoms are insufficient or unclear, provide a general assessment with appropriate recommendations.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Invalid response format from Gemini:', responseText);
        throw new Error('Invalid response format from Gemini');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini text analysis error:', error);
      throw error;
    }
  }

  // Analyze audio (first convert to text, then analyze)
  async analyzeAudio(audioBuffer, mimeType) {
    try {
      // First, convert audio to text using Gemini's audio capabilities
      const transcriptionPrompt = "Transcribe this audio recording of a farmer describing plant symptoms accurately and completely. Provide only the transcription text without any additional commentary.";
      
      const audioPart = {
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const transcriptionResult = await model.generateContent([transcriptionPrompt, audioPart]);
      const transcribedText = transcriptionResult.response.text().trim();

      // Then analyze the transcribed text
      return await this.analyzeText(transcribedText);
    } catch (error) {
      console.error('Gemini audio analysis error:', error);
      throw error;
    }
  }
}

module.exports = new GeminiService();