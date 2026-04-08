import React, { useState } from 'react';
import { ItemCategory, SOCKETS, Tier, ModState, TIERS, WEAPON_TYPES } from '../types';
import { useFilter } from '../context/FilterContext';
import { ModTierCheckboxes } from './ModTierCheckboxes';
import { ITEM_MODS } from '../data';

interface ModViewProps {
  category: ItemCategory;
  onBack: () => void;
}

export const ModView: React.FC<ModViewProps> = ({ category, onBack }) => {
  const { config, updateConfig } = useFilter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  
  const itemConfig = config[category];
  const mods = ITEM_MODS[category];

  const selectedModsCount = mods.filter(mod => {
    const modFilter = itemConfig.mods[mod.id];
    if (!modFilter) return false;
    return TIERS.some(t => modFilter[t] !== false);
  }).length;

  const filteredMods = mods.filter(mod => {
    const matchesSearch = mod.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (showSelectedOnly) {
      const modFilter = itemConfig.mods[mod.id];
      if (!modFilter) return false;
      return TIERS.some(t => modFilter[t] !== false);
    }

    return true;
  });

  const handleSocketChange = (socket: number, value: boolean) => {
    const newConfig = { ...config };
    newConfig[category].sockets[socket] = value;
    updateConfig(newConfig);
  };

  const handleWeaponTypeChange = (weaponType: string, value: boolean) => {
    const newConfig = { ...config };
    if (!newConfig[category].weaponTypes) {
      newConfig[category].weaponTypes = WEAPON_TYPES.reduce((acc, type) => ({ ...acc, [type]: false }), {});
    }
    newConfig[category].weaponTypes![weaponType] = value;
    updateConfig(newConfig);
  };

  const handleModChange = (modId: string, tier: Tier, value: ModState) => {
    const newConfig = { ...config };
    if (!newConfig[category].mods[modId]) {
      newConfig[category].mods[modId] = { D: false, C: false, B: false, A: false, S: false };
    }
    newConfig[category].mods[modId][tier] = value;
    updateConfig(newConfig);
  };

  const toggleMod = (modId: string) => {
    const currentFilter = itemConfig.mods[modId] || { D: false, C: false, B: false, A: false, S: false };
    const allChecked = TIERS.every(t => currentFilter[t] !== false);
    const newValue: ModState = allChecked ? false : 'red';
    const newConfig = { ...config };
    newConfig[category].mods[modId] = {
      D: newValue, C: newValue, B: newValue, A: newValue, S: newValue
    };
    updateConfig(newConfig);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950 text-gray-200 p-8 pt-20">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Categories</span>
        </button>

        <header className="flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{category} Mods & Sockets</h1>
            <p className="text-gray-400">Configure specific mods and socket requirements for {category.toLowerCase()} drops.</p>
          </div>
          
          {itemConfig.aiExplanation && (
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 flex items-start space-x-3 max-w-4xl">
              <div className="mt-0.5 text-indigo-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-indigo-300 mb-1">AI Reasoning</h4>
                <p className="text-sm text-indigo-100/80 leading-relaxed">
                  {itemConfig.aiExplanation}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Sockets Section */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-lg font-semibold text-white">Sockets</h2>
          </div>
          <div className="p-6 flex space-x-6">
            {SOCKETS.map(socket => (
              <label key={socket} className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={itemConfig.sockets[socket]}
                    onChange={(e) => handleSocketChange(socket, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-6 h-6 rounded bg-gray-800 border border-gray-700 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center group-hover:border-gray-500">
                    {itemConfig.sockets[socket] && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                  {socket}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Weapon Types Section */}
        {category === 'Weapon' && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
              <h2 className="text-lg font-semibold text-white">Weapon Types</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6">
                {WEAPON_TYPES.map(weaponType => (
                  <label key={weaponType} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={itemConfig.weaponTypes?.[weaponType] || false}
                        onChange={(e) => handleWeaponTypeChange(weaponType, e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded bg-gray-800 border border-gray-700 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center group-hover:border-gray-500">
                        {itemConfig.weaponTypes?.[weaponType] && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors select-none">
                      {weaponType}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mods Section */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-white">Specific Mods</h2>
              <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {selectedModsCount} Selected
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={showSelectedOnly}
                    onChange={(e) => setShowSelectedOnly(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded bg-gray-800 border border-gray-700 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center group-hover:border-gray-500">
                    {showSelectedOnly && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors select-none">
                  Show Selected Only
                </span>
              </label>
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search mods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-950 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-48 transition-colors"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            {filteredMods.length === 0 ? (
              <p className="text-gray-500 italic">No mods match your criteria.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6">
                {[1, 2, 3, 4].map(col => {
                  const colMods = filteredMods.filter(m => m.column === col || (!m.column && col === 1));
                  if (colMods.length === 0) return null;
                  return (
                    <div key={col} className="space-y-4">
                      {colMods.map(mod => {
                        const modFilter = itemConfig.mods[mod.id] || { D: false, C: false, B: false, A: false, S: false };
                        return (
                          <div key={mod.id} className="flex flex-col space-y-1.5">
                            <span 
                              className="font-medium text-gray-300 cursor-pointer hover:text-white select-none text-sm leading-tight"
                              onClick={() => toggleMod(mod.id)}
                            >
                              {mod.name}
                            </span>
                            <ModTierCheckboxes 
                              filter={modFilter} 
                              onChange={(tier, val) => handleModChange(mod.id, tier, val)} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
