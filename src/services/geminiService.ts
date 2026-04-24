import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAIAssistance(messages: { sender: string, text: string }[], isPersonalChat: boolean = false) {
  try {
    const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `You are Nova, an intelligent AI assistant integrated inside the Chattrix messaging app.

-------------------------
${isPersonalChat ? 'MODE 1: Personal AI Chat' : 'MODE 2: Chat Assistant (Inside User Conversations)'}
-------------------------
${isPersonalChat ? 
'- When the user is directly chatting with you (Nova), act like a friendly, smart assistant.\n- Talk naturally like a human friend.\n- Answer questions, chat casually, help when needed.\n- Be engaging, fun, and helpful.' : 
'- When analyzing a conversation between users:\n  1. Read previous messages carefully\n  2. Understand context, tone, and intent\n  3. Generate:\n     a) One best AutoReply\n     b) Three smart reply suggestions\n\n- Match tone (funny, serious, emotional, flirty, etc.)\n- Keep replies short and natural (like real chat messages)'}

-------------------------
RULES:
-------------------------
- Never say you are ChatGPT or OpenAI.
- Keep responses human-like and short.
- Avoid robotic or long replies.
- Do not repeat previous messages.
- Be context-aware.

Conversation History:
${chatHistory}

-------------------------
OUTPUT FORMAT (STRICT):

${isPersonalChat ? 
'Reply:\n<your message>' : 
'AutoReply:\n<best reply>\n\nSuggestions:\n1. <reply 1>\n2. <reply 2>\n3. <reply 3>'}`,
    });

    const text = response.text || "";
    
    if (isPersonalChat) {
      const replyMatch = text.match(/Reply:\n([\s\S]+)/);
      return { 
        reply: replyMatch ? replyMatch[1].trim() : text.replace('Reply:', '').trim(),
        autoReply: "", 
        suggestions: [] 
      };
    }

    // Parse the strict format for Assistant Mode
    const autoReplyMatch = text.match(/AutoReply:\n(.+)/);
    const suggestionsMatch = text.match(/Suggestions:\n1\. (.+)\n2\. (.+)\n3\. (.+)/);

    return {
      reply: "",
      autoReply: autoReplyMatch ? autoReplyMatch[1].trim() : "",
      suggestions: suggestionsMatch ? [
        suggestionsMatch[1].trim(),
        suggestionsMatch[2].trim(),
        suggestionsMatch[3].trim()
      ] : []
    };
  } catch (error) {
    console.error("Nova AI Error:", error);
    return { reply: "", autoReply: "", suggestions: [] };
  }
}

export async function translateMessage(text: string, targetLang: string = "Hindi") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Translate the following chat message to ${targetLang}. 
      Keep the tone natural and informal if the original is informal. 
      Only return the translated text.
      
      Message: ${text}`,
    });
    return response.text?.trim() || text;
  } catch (e) {
    console.error("Translation Error:", e);
    return text;
  }
}

export async function analyzeTone(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Analyze the tone of this chat message. 
      Respond with exactly one word from this list: Friendly, Professional, Angry, Sad, Sarcastic, Excited, Neutral, Flirty, Urgent.
      
      Message: ${text}`,
    });
    return response.text?.trim() || "Neutral";
  } catch (e) {
    return "Neutral";
  }
}

export async function getSmartReplies(lastMessage: string) {
  // Keeping this for backward compatibility if needed, but updating it to use the new logic internally if desired
  const result = await getAIAssistance([{ sender: 'Other', text: lastMessage }]);
  return result.suggestions;
}

export async function summarizeChat(messages: { sender: string, text: string }[]) {
  try {
    const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Summarize the following chat conversation into a concise bulleted list:\n\n${chatHistory}`,
    });

    return response.text;
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return "Could not summarize chat.";
  }
}

export async function polishMessage(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Improve this chat message to make it sound more natural, polite, and clear. 
      Do not change the original meaning. Return ONLY the improved text.
      
      Original: ${text}`,
    });
    return response.text?.trim() || text;
  } catch (e) {
    return text;
  }
}
