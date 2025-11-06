
import { GoogleGenAI } from "@google/genai";
import { GameState, BattleEvent, Army } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const dataUrlToGeminiPart = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        return null;
    }
    const [ , mimeType, data] = match;
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
}

const generateBattleReportPrompt = (gameState: GameState): string => {
  const p1General = gameState.player1.army?.characters.find(c => c.command?.some((cmd: any) => cmd.active && cmd.name_en === 'General'))?.name_en || 'The Commander';
  const p2General = gameState.player2.army?.characters.find(c => c.command?.some((cmd: any) => cmd.active && cmd.name_en === 'General'))?.name_en || 'The Warlord';

  const formatArmy = (army: Army | null) => {
    if (!army) return "An unknown force.";
    return `${army.name} (${army.army}) led by ${army.characters[0]?.name_en || 'a mysterious leader'}. Units: ${[...army.characters, ...army.core, ...army.special, ...army.rare].map(u => u.name_en).join(', ')}.`;
  };
  
  const log = gameState.battleLog.map(e => {
      const playerName = e.playerId === 'player1' 
        ? (gameState.player1.army?.name || 'Player 1')
        : (gameState.player2.army?.name || 'Player 2');
      
      let description = e.description;
      if (e.actingUnit) {
        description = `The unit "${e.actingUnit.unitName}" ${description}`;
      }
      if (e.targetUnit) {
        description += `, targeting the opposing "${e.targetUnit.unitName}"`;
      }

      return `Turn ${e.turn} - ${e.phase} (${playerName}): ${description}`;
  }).join('\n');


  return `
    You are a master storyteller and chronicler of epic battles in the Warhammer Old World.
    Write a dramatic and engaging battle report based on the following events.
    Refer to the provided images for visual context of key moments in each turn.
    Describe the clash of armies, the heroic deeds, and the tragic falls.
    Conclude with the final result.

    Army 1: ${formatArmy(gameState.player1.army)}
    Army 2: ${formatArmy(gameState.player2.army)}

    Battle Log:
    ${log}

    Final Score:
    ${gameState.player1.army?.name || 'Army 1'}: ${gameState.player1.victoryPoints} Victory Points
    ${gameState.player2.army?.name || 'Army 2'}: ${gameState.player2.victoryPoints} Victory Points

    Now, write the battle report.
  `;
};

const generateGeneralStoryPrompt = (gameState: GameState, player: 'player1' | 'player2'): string => {
    const povPlayer = player === 'player1' ? gameState.player1 : gameState.player2;
    const opponentPlayer = player === 'player1' ? gameState.player2 : gameState.player1;

    const general = povPlayer.army?.characters.find(c => c.command?.some((cmd: any) => cmd.active && cmd.name_en === 'General'))?.name_en || 'I, the commander';
    const armyName = povPlayer.army?.name || 'my army';
    const log = gameState.battleLog.map(e => {
        const povPrefix = e.playerId === player ? "My forces" : "The enemy's forces";

        let description = e.description;

        if (e.actingUnit) {
            description = `the unit "${e.actingUnit.unitName}" ${description}`;
        }
        if (e.targetUnit) {
            description += `, targeting the unit "${e.targetUnit.unitName}"`;
        }
        return `During turn ${e.turn}, in the ${e.phase}, ${povPrefix} acted: ${description}.`;
    }).join('\n');

    return `
      You are ${general}, the general of the ${armyName} army in the Warhammer Old World.
      Write a short, first-person story from your perspective about the recent battle.
      Recount the events, your strategic decisions, your triumphs, and your despair.
      The user will provide descriptions of what happened - you should weave them into a compelling narrative.
      Reflect on the outcome of the battle.

      My Army: ${povPlayer.army?.army}
      Opponent's Army: ${opponentPlayer.army?.army}

      Chronicle of Events:
      ${log}

      The Final Tally:
      My forces: ${povPlayer.victoryPoints} Victory Points
      Their forces: ${opponentPlayer.victoryPoints} Victory Points

      Now, write my story.
    `;
};


const generateRulesQueryPrompt = (query: string): string => {
  return `
    In the context of the Warhammer: The Old World tabletop game, please answer the following rules question concisely and clearly.

    Question: "${query}"
  `;
};

export const generateGeminiContent = async (
  type: 'BATTLE_REPORT' | 'GENERAL_STORY' | 'RULES_QUERY',
  gameState: GameState,
  options?: { player?: 'player1' | 'player2', query?: string }
): Promise<string> => {
  if (!API_KEY) {
    return "Gemini AI is not configured. Please set the API_KEY environment variable.";
  }
  
  let model = 'gemini-2.5-flash';
  let contents: any;

  switch (type) {
    case 'BATTLE_REPORT':
      model = 'gemini-2.5-pro';
      const promptText = generateBattleReportPrompt(gameState);
      const imageParts = Object.entries(gameState.turnPhotos)
        .map(([turn, dataUrl]) => {
            const part = dataUrlToGeminiPart(dataUrl);
            if (!part) return [];
            return [{text: `Image for Turn ${turn}:`}, part];
        })
        .flat();
      
      contents = [ {text: promptText}, ...imageParts ];
      break;
    case 'GENERAL_STORY':
      if (!options?.player) throw new Error('Player perspective is required for story generation.');
      model = 'gemini-2.5-pro';
      contents = generateGeneralStoryPrompt(gameState, options.player);
      break;
    case 'RULES_QUERY':
       if (!options?.query) throw new Error('A query is required for rules clarification.');
      contents = generateRulesQueryPrompt(options.query);
      break;
    default:
      throw new Error('Invalid Gemini request type');
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "There was an error communicating with the Gemini API. Please check the console for details.";
  }
};