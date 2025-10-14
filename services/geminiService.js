import {GoogleGenAI} from '@google/genai';
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';


if (!GEMINI_API_KEY) {
  throw new Error('Gemini API Key is not set');
}

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

/**
 * String generation using Gemini API
 * @param {String} prompt 
 * @returns 
 */
export async function generateText(prompt) {
  if (!prompt) {
    throw new Error("Prompt cannot be empty.");
  }
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return response.text;
}

export async function generateFromFile(prompt, fileData) {

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: prompt
        },
        {
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.data
          }
        }
      ]
    }
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: contents,
  });

  return response.text;
}