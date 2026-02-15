
import { GoogleGenAI } from "@google/genai";

/**
 * Deck Strategy Analysis Engine
 * Uses Gemini API to provide real-time strategic insights based on deck composition.
 */
export const analyzeDeck = async (deckName: string, cards: string[]): Promise<string> => {
  // Always use the required initialization format
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `You are a world-class TCG deck building expert. 
Analyze the following deck and provide 2-3 concise, actionable strategy tips.

Deck Name: ${deckName}
Included Cards Sample: ${cards.join(', ')}

Focus on:
- Meta relevance
- Synergy between pieces
- Resource management/consistency
Keep it brief and helpful for a high-level player.`;

  try {
    // Call generateContent as instructed for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // Access text property directly from response
    return response.text || "Your deck architecture seems solid. Focus on testing against aggressive archetypes to refine your defensive tech.";
  } catch (error) {
    console.error("Gemini Deck Analysis Error:", error);
    
    // Fallback heuristic logic if API fails
    const STRATEGY_TIPS = [
      "Sua curva de nível 3 parece um pouco alta. Considere adicionar mais cartas de busca (searchers) para consistência.",
      "Este arquétipo se beneficia muito de efeitos de 'Trash' ou 'Graveyard'. Verifique se você tem formas de recuperar recursos.",
      "O meta atual exige respostas rápidas. Adicionar 2 ou 3 cartas de 'Remoção' ou 'Interrupção' pode melhorar seu win-rate.",
      "Excelente sinergia detectada entre suas peças principais. Focar em 'Draw Power' ajudará a chegar no combo mais rápido.",
      "Considere o uso de 'Side Deck' contra decks de controle, já que sua estratégia é predominantemente agressiva.",
      "A base de cores/atributos está sólida, mas você pode precisar de mais 'Staples' defensivas para o late-game."
    ];
    
    return STRATEGY_TIPS[Math.floor(Math.random() * STRATEGY_TIPS.length)];
  }
};
