import { AppFilterConfig, ItemCategory, Rarity, Tier, ModState, TIERS, RARITIES, WEAPON_TYPES, createDefaultAppFilterConfig } from '../types';
import { STAT_ID_TO_MOD_ID } from '../data/statMap';

const ITEM_SLOT_KEYS: Record<string, ItemCategory> = {
  t0: 'Helmet',
  t1: 'Armor', // Chest
  t2: 'Boots',
  t3: 'Weapon',
  t4: 'Gloves',
  t5: 'Amulet',
  t6: 'Shield',
  t7: 'Ring',
  t8: 'Belt',
  t10: 'Charm',
  t18: 'Potion', // Consumable
  t15: 'Socketable'
};

const TIER_KEYS: Record<string, Tier> = {
  tr0: 'D',
  tr1: 'C',
  tr2: 'B',
  tr3: 'A',
  tr4: 'S'
};

const CATEGORY_TO_SLOT_KEY: Record<string, string> = Object.entries(ITEM_SLOT_KEYS).reduce((acc, [key, cat]) => {
  acc[cat] = key;
  return acc;
}, {} as any);

const TIER_TO_KEY: Record<string, string> = Object.entries(TIER_KEYS).reduce((acc, [key, tier]) => {
  acc[tier] = key;
  return acc;
}, {} as any);

const MOD_ID_TO_STAT_IDS: Record<string, number[]> = {};
Object.entries(STAT_ID_TO_MOD_ID).forEach(([statId, modId]) => {
  if (!MOD_ID_TO_STAT_IDS[modId]) MOD_ID_TO_STAT_IDS[modId] = [];
  MOD_ID_TO_STAT_IDS[modId].push(Number(statId));
});

const ALL_STAT_IDS = Object.keys(STAT_ID_TO_MOD_ID).map(Number);

export const encodeBase64Filter = (config: AppFilterConfig): string => {
  const output: any = { version: 2 };

  // Weapon Types (wtc)
  let wtc = 0;
  let allWeaponTypesEnabled = true;
  WEAPON_TYPES.forEach((type, index) => {
    if (config.Weapon.weaponTypes?.[type]) {
      wtc |= (1 << (index + 1));
    } else {
      allWeaponTypesEnabled = false;
    }
  });
  
  if (!allWeaponTypesEnabled) {
    output.wtc = wtc;
  }

  // Categories
  Object.entries(CATEGORY_TO_SLOT_KEY).forEach(([category, slotKey]) => {
    const categoryConfig = config[category as ItemCategory];
    const slotData: any = {};

    // Sockets (soc)
    let soc = 0;
    let allSocketsEnabled = true;
    for (let i = 1; i <= 6; i++) {
      if (categoryConfig.sockets[i]) {
        soc |= (1 << (i - 1));
      } else {
        allSocketsEnabled = false;
      }
    }
    
    // User requirement: If all 6 sockets are active, omit soc.
    // If any are hidden, include soc (even if 0).
    if (!allSocketsEnabled) {
      slotData.soc = soc;
    }

    // Tiers
    TIERS.forEach(tier => {
      const tierKey = TIER_TO_KEY[tier];
      const tierData: any = {};
      
      // Rarities (rs)
      let rs = 0;
      RARITIES.forEach((rarity, index) => {
        if (categoryConfig.rarities[rarity][tier]) {
          rs |= (1 << index);
        }
      });
      tierData.rs = rs;

      // Mods (hs, hls)
      const hs: number[] = [];
      const hls: number[] = [];

      // Iterate over ALL possible stats to ensure a strict filter
      ALL_STAT_IDS.forEach(statId => {
        const modId = STAT_ID_TO_MOD_ID[statId];
        const state = categoryConfig.mods[modId]?.[tier];

        if (state === 'yellow') {
          hls.push(statId);
        } else if (state === 'red') {
          // Visible, do nothing
        } else {
          // Hidden (state is false or undefined)
          hs.push(statId);
        }
      });

      if (hs.length > 0) tierData.hs = hs;
      if (hls.length > 0) tierData.hls = hls;

      slotData[tierKey] = tierData;
    });

    output[slotKey] = slotData;
  });

  return btoa(JSON.stringify(output));
};

export const decodeBase64Filter = (base64String: string): AppFilterConfig => {
  try {
    const jsonString = atob(base64String);
    const parsed = JSON.parse(jsonString);
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid filter format');
    }

    const config = createDefaultAppFilterConfig();

    // Parse weapon types
    if (parsed.wtc !== undefined) {
      const wtc = Number(parsed.wtc);
      // If wtc is 0, -1, or NaN, it often means all weapon types are selected in some filter formats
      // Or if it's a very large number that got truncated.
      if (wtc === 0 || wtc === -1 || isNaN(wtc)) {
        WEAPON_TYPES.forEach(type => {
          config.Weapon.weaponTypes![type] = true;
        });
      } else {
        WEAPON_TYPES.forEach((type, index) => {
          // index + 1 because 0 is "Item"
          const bitIndex = index + 1;
          const isEnabled = (wtc & (1 << bitIndex)) !== 0;
          config.Weapon.weaponTypes![type] = isEnabled;
        });
      }
    } else {
      // If wtc is missing, it usually means all weapon types are enabled
      WEAPON_TYPES.forEach(type => {
        config.Weapon.weaponTypes![type] = true;
      });
    }

    // Parse categories
    Object.entries(ITEM_SLOT_KEYS).forEach(([slotKey, category]) => {
      const slotData = parsed[slotKey];

      // Parse sockets
      if (slotData && slotData.soc !== undefined) {
        const soc = slotData.soc as number;
        for (let i = 0; i < 6; i++) {
          // Socket N is bit N-1 (e.g. Socket 1 is bit 0)
          const isEnabled = (soc & (1 << i)) !== 0;
          config[category].sockets[i + 1] = isEnabled;
        }
      } else {
        // If slotData is missing OR soc is missing, all 6 sockets are active
        for (let i = 1; i <= 6; i++) {
          config[category].sockets[i] = true;
        }
      }

      // Parse tiers and mods
      Object.entries(TIER_KEYS).forEach(([tierKey, tier]) => {
        const tierData = slotData ? slotData[tierKey] : undefined;
        
        if (!tierData) {
          // If tier data is missing, all rarities and mods are enabled for this tier
          RARITIES.forEach(r => config[category].rarities[r][tier] = true);
          Object.values(STAT_ID_TO_MOD_ID).forEach(modId => {
            if (!config[category].mods[modId]) {
              config[category].mods[modId] = { D: false, C: false, B: false, A: false, S: false };
            }
            config[category].mods[modId][tier] = 'red';
          });
          return;
        }

        // Parse rarities (rs)
        if (tierData.rs !== undefined) {
          const rs = tierData.rs as number;
          config[category].rarities.Common[tier] = (rs & 1) !== 0;
          config[category].rarities.Superior[tier] = (rs & 2) !== 0;
          config[category].rarities.Rare[tier] = (rs & 4) !== 0;
          config[category].rarities.Mythic[tier] = (rs & 8) !== 0;
          config[category].rarities.Satanic[tier] = (rs & 16) !== 0;
        } else {
          // If rs is missing, all rarities are enabled for this tier
          RARITIES.forEach(r => config[category].rarities[r][tier] = true);
        }

        // Parse mods
        const hs = tierData.hs as number[] || [];
        const hls = tierData.hls as number[] || [];

        // Group stat IDs by modId to prevent overwriting
        const modIdToStatIds: Record<string, number[]> = {};
        Object.entries(STAT_ID_TO_MOD_ID).forEach(([statIdStr, modId]) => {
          if (!modIdToStatIds[modId]) {
            modIdToStatIds[modId] = [];
          }
          modIdToStatIds[modId].push(parseInt(statIdStr, 10));
        });

        Object.entries(modIdToStatIds).forEach(([modId, statIds]) => {
          if (!config[category].mods[modId]) {
            config[category].mods[modId] = { D: false, C: false, B: false, A: false, S: false };
          }
          
          // If ANY of the stat IDs for this mod are in hls, it's yellow
          const isYellow = statIds.some(id => hls.includes(id));
          // If ANY of the stat IDs for this mod are in hs, it's false (disabled)
          const isFalse = statIds.some(id => hs.includes(id));

          if (isYellow) {
            config[category].mods[modId][tier] = 'yellow';
          } else if (isFalse) {
            config[category].mods[modId][tier] = false;
          } else {
            config[category].mods[modId][tier] = 'red'; // Normal open
          }
        });
      });
    });

    return config;
  } catch (error) {
    console.error("Error decoding base64 filter:", error);
    throw new Error("Invalid Base64 Filter Code");
  }
};
