
// NOTE: This service requires the '@google/genai' package.
// Install it with: npm install @google/genai

import { GoogleGenAI, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

const getChat = (): Chat => {
  if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  if (!chat) {
     chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are Arstate Assistant, a helpful and friendly chatbot integrated into Arstate Chats. Keep your responses concise and helpful.',
        },
      });
  }
  return chat;
}


export const streamChatResponse = async (prompt: string, onChunk: (text: string) => void) => {
    try {
        const chatInstance = getChat();
        const result = await chatInstance.sendMessageStream({ message: prompt });

        for await (const chunk of result) {
            onChunk(chunk.text);
        }
    } catch (error) {
        console.error("Gemini API error:", error);
        onChunk("Sorry, I'm having trouble connecting to my brain right now. Please try again later.");
    }
};
