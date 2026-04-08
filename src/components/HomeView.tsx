import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ITEM_CATEGORIES, RARITIES, ItemCategory, Tier, Rarity, TIERS } from '../types';
import { useFilter } from '../context/FilterContext';
import { TierCheckboxes } from './TierCheckboxes';
import { suggestGlobalFilterConfig } from '../services/gemini';

interface HomeViewProps {
  onCategoryClick: (category: ItemCategory) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onCategoryClick }) => {
  const { config, updateConfig } = useFilter();
  const [buildName, setBuildName] = useState('');
  const [difficulty, setDifficulty] = useState('Inferno');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleRarityChange = (category: ItemCategory, rarity: Rarity, tier: Tier, value: boolean) => {
    const newConfig = { ...config };
    newConfig[category].rarities[rarity][tier] = value;
    updateConfig(newConfig);
  };

  const toggleRarity = (category: ItemCategory, rarity: Rarity) => {
    const currentFilter = config[category].rarities[rarity];
    const allChecked = TIERS.every(t => currentFilter[t]);
    const newValue = !allChecked;
    const newConfig = { ...config };
    newConfig[category].rarities[rarity] = {
      D: newValue, C: newValue, B: newValue, A: newValue, S: newValue
    };
    updateConfig(newConfig);
  };

  const handleSuggest = async () => {
    if (!buildName.trim()) return;
    setIsSuggesting(true);
    try {
      const suggestion = await suggestGlobalFilterConfig(buildName, difficulty);
      const newConfig = { ...config };
      
      ITEM_CATEGORIES.forEach(cat => {
        if (suggestion[cat]) {
          newConfig[cat] = {
            ...newConfig[cat],
            rarities: suggestion[cat].rarities || newConfig[cat].rarities,
            sockets: suggestion[cat].sockets || newConfig[cat].sockets,
            mods: suggestion[cat].mods || newConfig[cat].mods,
            weaponTypes: suggestion[cat].weaponTypes || newConfig[cat].weaponTypes,
            aiExplanation: suggestion[cat].aiExplanation || ''
          };
        }
      });
      
      updateConfig(newConfig);
    } catch (error) {
      alert('Failed to generate suggestion. Please try again.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const rarityColors: Record<Rarity, string> = {
    Common: 'text-white',
    Superior: 'text-blue-400',
    Rare: 'text-yellow-400',
    Mythic: 'text-pink-400',
    Satanic: 'text-red-500'
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950 text-gray-200 p-8 pt-20">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Hero Siege Loot Filter</h1>
            <p className="text-gray-400">Configure base rarities for all items, or click an item name to configure specific mods and sockets.</p>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col space-y-3 w-80">
            <label className="text-sm font-medium text-gray-300">AI Auto-Configure All</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Normal">Normal</option>
              <option value="Nightmare">Nightmare</option>
              <option value="Hell">Hell</option>
              <option value="Inferno">Inferno</option>
            </select>
            <input 
              type="text" 
              placeholder="Build (e.g. Poison Necro)" 
              value={buildName}
              onChange={(e) => setBuildName(e.target.value)}
              className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <motion.button 
              onClick={handleSuggest}
              disabled={isSuggesting || !buildName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20"
              whileTap={{ scale: 0.95 }}
            >
              {isSuggesting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Auto-Configure</span>
                </>
              )}
            </motion.button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ITEM_CATEGORIES.map(category => (
            <div key={category} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
              <div 
                className="px-6 py-4 border-b border-gray-800 bg-gray-900/80 hover:bg-gray-800 cursor-pointer transition-all active:bg-gray-700 flex items-center justify-between group"
                onClick={() => onCategoryClick(category)}
              >
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{category}</h2>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="p-4 space-y-3 flex-1">
                {RARITIES.map(rarity => (
                  <div key={rarity} className="flex items-center justify-between">
                    <motion.span 
                      className={`text-sm font-medium cursor-pointer select-none hover:opacity-80 transition-all ${rarityColors[rarity]}`}
                      onClick={() => toggleRarity(category, rarity)}
                      whileTap={{ scale: 0.9 }}
                    >
                      {rarity}
                    </motion.span>
                    <TierCheckboxes 
                      filter={config[category].rarities[rarity]} 
                      onChange={(tier, val) => handleRarityChange(category, rarity, tier, val)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
