import { GoogleGenAI } from '@google/genai';
import { COMMON_MODS } from '../data/commonMods';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const suggestGlobalFilterConfig = async (
  buildName: string,
  difficulty: string
): Promise<any> => {
  const validModIds = COMMON_MODS.map(m => m.id).join(', ');
  
  const prompt = `
    You are an expert Hero Siege player and theorycrafter. A user wants a complete, highly optimized, and LOGICAL loot filter configuration for a "${buildName}" build playing on "${difficulty}" difficulty.
    
    CRITICAL INSTRUCTIONS:
    1. Be incredibly selective and logical. Think deeply about what stats this specific build actually scales with (e.g., physical vs elemental, attack speed vs cast rate, specific attributes). Do NOT add mod bloat. Only include mods that are strictly necessary or best-in-slot for this specific build.
    2. Difficulty Context (${difficulty}): Adjust your strictness. For Normal/Nightmare, be more forgiving with tiers and sockets. For Hell/Inferno, be extremely strict and only highlight (yellow) the absolute best-in-slot mods and highest tiers.
    3. CRITICAL SOCKET RULES: You MUST respect the maximum socket limits for each item type. Do NOT set a socket number to true if it exceeds the maximum.
       - Armor: Max 6 sockets.
       - Weapon: Max 6 sockets.
       - Helmet: Max 4 sockets.
       - Shield: Max 4 sockets.
       - Gloves, Boots, Belt, Amulet, Ring, Charm, Potion, Socketable: 0 sockets (set all socket numbers 1-6 to false).
    4. WEAPON TYPES: For the "Weapon" category ONLY, you MUST include a "weaponTypes" object. Set the appropriate weapon types to true based on the build (e.g. "Staff" and "Wand" for a mage, "Sword" and "Axe" for a melee fighter).
       - Available Weapon Types: Sword, Dagger, Mace, Axe, Claw, Polearm, Chainsaw, Staff, Cane, Wand, Book, Spellblade, Bow, Gun, Flask, Throwing, Novelty.
    5. For mods, you can assign false, "red", or "yellow" to each tier (D, C, B, A, S).
       - "red" means standard filter selection.
       - "yellow" means HIGHLIGHT. Use "yellow" ONLY for the absolute most important core mods and high tiers (like A or S) that the build desperately needs to see clearly when dropped.
    6. Provide a brief "aiExplanation" (1-2 sentences) for EACH item category explaining exactly WHY you chose these specific mods and sockets for this build.
       - LANGUAGE RULE: Write the "aiExplanation" in TURKISH, but keep game terms (like 'All Skills', 'FCR', 'Helmet', 'Satanic', 'Sockets', 'Rune Word') in English. It should sound natural to a Turkish gamer.
    7. Available mod IDs are: ${validModIds}
    
    Return a JSON object containing configurations for all 12 categories: Helmet, Weapon, Shield, Charm, Armor, Gloves, Ring, Socketable, Boots, Amulet, Belt, Potion.
    
    JSON Structure Example:
    {
      "Weapon": {
        "aiExplanation": "Büyücü buildi olduğu için Staff ve Wand seçildi. Hasarı artırmak için FCR ve +All Skills eklendi.",
        "rarities": {
          "Common": { "D": false, "C": false, "B": false, "A": false, "S": false },
          "Superior": { "D": false, "C": false, "B": false, "A": false, "S": false },
          "Rare": { "D": false, "C": false, "B": false, "A": false, "S": false },
          "Mythic": { "D": false, "C": false, "B": false, "A": false, "S": false },
          "Satanic": { "D": false, "C": false, "B": false, "A": true, "S": true }
        },
        "sockets": { "1": false, "2": false, "3": true, "4": true, "5": true, "6": true },
        "weaponTypes": {
          "Sword": false, "Dagger": false, "Mace": false, "Axe": false,
          "Claw": false, "Polearm": false, "Chainsaw": false, "Staff": true,
          "Cane": false, "Wand": true, "Book": false, "Spellblade": false,
          "Bow": false, "Gun": false, "Flask": false, "Throwing": false
        },
        "mods": {
          "mod_all_skills": { "D": false, "C": false, "B": false, "A": "red", "S": "yellow" }
        }
      }
      // ... repeat for all 12 categories
    }
    
    Only return valid JSON. Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating filter suggestion:", error);
    throw error;
  }
};
