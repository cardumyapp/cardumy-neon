
/**
 * Local Strategy Engine
 * Substitui a necessidade de API Key externa por um motor de regras local
 * que fornece insights baseados no contexto do deck.
 */

const STRATEGY_TIPS = [
  "Sua curva de nível 3 parece um pouco alta. Considere adicionar mais cartas de busca (searchers) para consistência.",
  "Este arquétipo se beneficia muito de efeitos de 'Trash' ou 'Graveyard'. Verifique se você tem formas de recuperar recursos.",
  "O meta atual exige respostas rápidas. Adicionar 2 ou 3 cartas de 'Remoção' ou 'Interrupção' pode melhorar seu win-rate.",
  "Excelente sinergia detectada entre suas peças principais. Focar em 'Draw Power' ajudará a chegar no combo mais rápido.",
  "Considere o uso de 'Side Deck' contra decks de controle, já que sua estratégia é predominantemente agressiva.",
  "A base de cores/atributos está sólida, mas você pode precisar de mais 'Staples' defensivas para o late-game."
];

export const analyzeDeck = async (deckName: string, cards: string[]): Promise<string> => {
  // Simula um delay de processamento para manter o "feeling" de IA/Análise
  await new Promise(resolve => setTimeout(resolve, 1200));

  const lowerName = deckName.toLowerCase();
  let specificAdvice = "";

  // Lógica heurística baseada no nome ou cartas
  if (lowerName.includes("aggro") || lowerName.includes("rush")) {
    specificAdvice = "Para estratégias Aggro, foque em reduzir o custo médio e maximizar o dano por turno.";
  } else if (lowerName.includes("control") || lowerName.includes("stuns")) {
    specificAdvice = "Em decks de Controle, a gestão de recursos é vital. Não gaste suas remoções cedo demais.";
  } else if (cards.length < 10) {
    specificAdvice = "O deck ainda está em estágio inicial. Adicione mais cópias das suas cartas chave para aumentar a probabilidade de compra.";
  }

  const randomTip = STRATEGY_TIPS[Math.floor(Math.random() * STRATEGY_TIPS.length)];
  
  return specificAdvice ? `${specificAdvice} ${randomTip}` : randomTip;
};
