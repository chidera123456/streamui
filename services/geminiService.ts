
import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion, Comment } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCorrectedQuery = async (query: string): Promise<string | null> => {
  const ai = getAIClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user searched for: "${query}". 
      If this is a misspelled movie/TV title or a description of a specific film, return only the correct official title.
      If it's already correct or too vague to identify a single specific title, return the original query.
      Output ONLY the title string, no explanation.`,
      config: {
        temperature: 0.1, // Low temperature for precision
      }
    });

    const corrected = response.text?.trim() || null;
    return (corrected && corrected.toLowerCase() !== query.toLowerCase()) ? corrected : null;
  } catch (e) {
    console.error("Failed to correct query with Gemini", e);
    return null;
  }
};

export const getAISuggestions = async (prompt: string): Promise<AISuggestion[]> => {
  const ai = getAIClient();
  
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

export const getCommentVibe = async (comments: Comment[], mediaTitle: string): Promise<string> => {
  if (comments.length === 0) return "Silence awaits your first impression.";
  
  const ai = getAIClient();
  const commentText = comments.map(c => `${c.username}: ${c.content}`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a cinematic vibe analyst. Here are some user comments about "${mediaTitle}":
      
      ${commentText}
      
      Synthesize these comments into a single, punchy, high-level "Collective Vibe" sentence (max 15 words). 
      Make it sound sophisticated and observant. If comments are sparse, focus on the general mood.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "The community is currently gathering thoughts.";
  } catch (e) {
    return "The collective signal is faint but growing.";
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
