export type Tier = 'D' | 'C' | 'B' | 'A' | 'S';
export type Rarity = 'Common' | 'Superior' | 'Rare' | 'Mythic' | 'Satanic';
export type ItemCategory = 'Helmet' | 'Weapon' | 'Shield' | 'Charm' | 'Armor' | 'Gloves' | 'Ring' | 'Socketable' | 'Boots' | 'Amulet' | 'Belt' | 'Potion';

export interface Mod {
  id: string;
  name: string;
  column?: 1 | 2 | 3 | 4;
}

export interface TierFilter {
  D: boolean;
  C: boolean;
  B: boolean;
  A: boolean;
  S: boolean;
}

export type ModState = false | 'red' | 'yellow';

export interface ModTierFilter {
  D: ModState;
  C: ModState;
  B: ModState;
  A: ModState;
  S: ModState;
}

export interface ItemFilterConfig {
  rarities: Record<Rarity, TierFilter>;
  sockets: Record<number, boolean>; // 1 to 6
  mods: Record<string, ModTierFilter>; // modId -> ModTierFilter
  weaponTypes?: Record<string, boolean>; // Only used for Weapon category
  aiExplanation?: string;
}

export type AppFilterConfig = Record<ItemCategory, ItemFilterConfig>;

export interface SavedFilter {
  id: string;
  name: string;
  config: AppFilterConfig;
  updatedAt: number;
}

export const TIERS: Tier[] = ['D', 'C', 'B', 'A', 'S'];
export const RARITIES: Rarity[] = ['Common', 'Superior', 'Rare', 'Mythic', 'Satanic'];
export const ITEM_CATEGORIES: ItemCategory[] = ['Helmet', 'Weapon', 'Shield', 'Charm', 'Armor', 'Gloves', 'Ring', 'Socketable', 'Boots', 'Amulet', 'Belt', 'Potion'];
export const SOCKETS = [1, 2, 3, 4, 5, 6];
export const WEAPON_TYPES = [
  'Sword', 'Dagger', 'Mace', 'Axe',
  'Claw', 'Polearm', 'Chainsaw', 'Staff',
  'Cane', 'Wand', 'Book', 'Spellblade',
  'Bow', 'Gun', 'Flask', 'Throwing'
];

export const createDefaultTierFilter = (): TierFilter => ({
  D: false, C: false, B: false, A: false, S: false
});

export const createDefaultItemFilterConfig = (): ItemFilterConfig => ({
  rarities: {
    Common: createDefaultTierFilter(),
    Superior: createDefaultTierFilter(),
    Rare: createDefaultTierFilter(),
    Mythic: createDefaultTierFilter(),
    Satanic: createDefaultTierFilter(),
  },
  sockets: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
  mods: {},
  weaponTypes: WEAPON_TYPES.reduce((acc, type) => ({ ...acc, [type]: false }), {}),
  aiExplanation: ''
});

export const createDefaultAppFilterConfig = (): AppFilterConfig => {
  const config: Partial<AppFilterConfig> = {};
  ITEM_CATEGORIES.forEach(cat => {
    config[cat] = createDefaultItemFilterConfig();
  });
  return config as AppFilterConfig;
};
