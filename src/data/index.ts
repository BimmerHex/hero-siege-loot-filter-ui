import { ItemCategory, Mod } from '../types';
import { COMMON_MODS } from './commonMods';

export const ITEM_MODS: Record<ItemCategory, Mod[]> = {
  Helmet: COMMON_MODS,
  Weapon: COMMON_MODS,
  Shield: COMMON_MODS,
  Charm: COMMON_MODS,
  Armor: COMMON_MODS,
  Gloves: COMMON_MODS,
  Ring: COMMON_MODS,
  Socketable: COMMON_MODS,
  Boots: COMMON_MODS,
  Amulet: COMMON_MODS,
  Belt: COMMON_MODS,
  Potion: COMMON_MODS,
};
