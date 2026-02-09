
import { GoogleGenAI } from "@google/genai";

export const analyzeDeck = async (deckName: string, cards: string[]) => {
  // Always use a named parameter and direct process.env.API_KEY string
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Como um especialista em TCG, analise este deck de ${deckName}. 
  Cartas principais: ${cards.join(', ')}. 
  Dê sugestões de melhorias de meta e pontos fortes da estratégia.`;

  try {
    const response = await ai.models.generateContent({
      // Complex reasoning tasks such as TCG strategy analysis should use gemini-3-pro-preview
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // response.text is a property, not a method
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Não foi possível gerar a análise no momento.";
  }
};
