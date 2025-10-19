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
        { text: prompt },
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

// Store session conversation history
let conversationHistory = [];
let isPersonalitySet = false;

// Clear session conversation history
export function clearConversationHistory() {
  conversationHistory = [];
  isPersonalitySet = false;
  console.log('Session conversation history cleared, personality reset');
}

// Get current conversation history
export function getConversationHistory() {
  return [...conversationHistory];
}

// Initialize personality setup
function initializePersonality() {
  if (!isPersonalitySet && conversationHistory.length === 0) {
    // Add initial system context to conversation
    conversationHistory.push({
      role: 'model',
      parts: [{
        text: "Halo! Saya Neng AI, seorang asisten virtual yang ramah dari Sunda. Saya siap membantu Anda dengan berbagai pertanyaan dan tugas. Bagaimana saya bisa membantu Anda hari ini?"
      }]
    });
    isPersonalitySet = true;
  }
}

// Conversation with persistent context
export async function conversation(payload) {
  try {
    // Initialize personality if needed
    initializePersonality();
    
    // Add new messages to conversation history
    payload.forEach(message => {
      const historyEntry = {
        role: message.role === 'user' ? 'user' : 'model',
        parts: []
      };
      
      if (typeof message.content === 'string') {
        historyEntry.parts.push({text: message.content});
      } else if (message.content.file) {
        // Add text part if exists
        if (message.content.text) {
          historyEntry.parts.push({text: message.content.text});
        }
        // Add file part
        historyEntry.parts.push({
          inlineData: {
            mimeType: message.content.file.mimeType,
            data: message.content.file.data
          }
        });
      } else if (message.content.text) {
        historyEntry.parts.push({text: message.content.text});
      }
      
      conversationHistory.push(historyEntry);
    });

    // Enhanced system instruction with more specific personality
    const systemInstructionText = `
Kamu adalah Neng AI, seorang asisten virtual yang memiliki kepribadian gadis Sunda yang ramah dan helpful. 

Karakteristik kepribadian kamu:
- Nama: Neng AI (selalu perkenalkan diri dengan nama ini)
- Asal: Sunda, Indonesia
- Sifat: Sangat ramah, sopan, helpful, dan warm
- Bahasa: Gunakan bahasa Indonesia campur dengan bahasa Sunda yang friendly dan kadang sedikit accent Sunda yang halus
- Emosi: Selalu gunakan emoticon yang sesuai untuk mengekspresikan emosi
- Respon: Berikan jawaban yang personal dan engaging

Selalu ingat identitas ini dalam setiap percakapan dan konsisten dengan karakteristik ini.
    `.trim();

    // Use the correct Google Gemini API with enhanced system instruction
    let response;
    
    try {
      // Approach 1: Using systemInstruction parameter (preferred)
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: conversationHistory,
        systemInstruction: {
          parts: [
            {
              text: systemInstructionText
            }
          ]
        }
      });
    } catch (error) {
      console.log('Error', error.message);
      
      // Approach 2: Inject personality into the first user message
//       const modifiedHistory = [...conversationHistory];
//       if (modifiedHistory.length > 0 && modifiedHistory[modifiedHistory.length - 1].role === 'user') {
//         const lastUserMessage = modifiedHistory[modifiedHistory.length - 1];
//         lastUserMessage.parts[0].text = `
// ${systemInstructionText}

// User message: ${lastUserMessage.parts[0].text}

// Please respond as Neng AI with the personality described above.
//         `.trim();
//       }
      
//       response = await ai.models.generateContent({
//         model: GEMINI_MODEL,
//         contents: modifiedHistory
//       });
//       console.log('✅ Using personality injection approach');
    }

    console.log('Gemini API response received');

    // Add AI response to conversation history
    const aiResponse = response.text;
    conversationHistory.push({
      role: 'model',
      parts: [{text: aiResponse}]
    });

    console.log('AI response added to history. Total messages:', conversationHistory.length);
    
    return aiResponse;
    
  } catch (error) {
    console.error('Error in conversation function:', error);
    throw error;
  }
}