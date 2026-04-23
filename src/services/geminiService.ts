import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getSmartReplies(lastMessage: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3 short, modern chat replies to this message: "${lastMessage}". Format as a JSON array of strings. Keep it casual like WhatsApp.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Smart Reply Error:", error);
    return [];
  }
}

export async function summarizeChat(messages: { sender: string, text: string }[]) {
  try {
    const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following chat conversation into a concise bulleted list:\n\n${chatHistory}`,
    });

    return response.text;
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return "Could not summarize chat.";
  }
}
