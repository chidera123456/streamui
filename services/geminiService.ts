
import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion } from "../types";

// Always use process.env.API_KEY directly for initialization
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAISuggestions = async (prompt: string): Promise<AISuggestion[]> => {
  const ai = getAIClient();
  
  // Using gemini-3-pro-preview for more nuanced reasoning on user moods/queries
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze the user's request for movies or TV series and provide 6 diverse, high-quality recommendations that fit the mood. 
    User request: "${prompt}"
    Ensure recommendations vary in popularity (mix of blockbusters and hidden gems) but remain strictly relevant to the vibe.`,
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the movie or series" },
            reason: { type: Type.STRING, description: "A brief, catchy, and deep explanation of why it fits the request" }
          },
          required: ["title", "reason"]
        }
      }
    }
  });

  try {
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini suggestions", e);
    return [];
  }
};

export const getSimilarRecommendations = async (title: string, overview: string): Promise<AISuggestion[]> => {
  const ai = getAIClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `The user is watching "${title}". 
    Overview: "${overview}"
    Recommend 5 similar movies or TV series that someone who liked this would enjoy. 
    Focus on thematic depth, visual style, or plot parallels. Avoid obvious sequels.`,
    config: {
      thinkingConfig: { thinkingBudget: 2000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the recommended movie or series" },
            reason: { type: Type.STRING, description: "A one-sentence expert cinematic explanation of the similarity" }
          },
          required: ["title", "reason"]
        }
      }
    }
  });

  try {
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini similarity response", e);
    return [];
  }
};
