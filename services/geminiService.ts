
import { GoogleGenAI, Type } from "@google/genai";
import { JargonTerm } from "../types.ts";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async defineTerm(term: string): Promise<Partial<JargonTerm>> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a pronunciation guide (IPA or phonetic) and a list of meanings for the jargon term: "${term}". 
        Include different parts of speech if applicable (e.g. noun, verb).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pronunciation: { type: Type.STRING },
              meanings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    partOfSpeech: { type: Type.STRING, description: "e.g., noun, verb, adjective" },
                    definition: { type: Type.STRING },
                    example: { type: Type.STRING }
                  },
                  required: ["partOfSpeech", "definition"]
                }
              },
              category: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["pronunciation", "meanings", "category", "tags"]
          },
          systemInstruction: "You are an expert etymologist specializing in niche community jargon and tech slang. Keep definitions sleek, witty, and accurate. For meanings, always return an array even if there is only one."
        }
      });

      const result = JSON.parse(response.text || "{}");
      return {
        ...result,
        term,
        isAiGenerated: true,
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error("Gemini definition error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
