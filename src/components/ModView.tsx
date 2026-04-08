import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ItemCategory, SOCKETS, Tier, ModState, TIERS, WEAPON_TYPES, ITEM_CATEGORIES } from '../types';
import { useFilter } from '../context/FilterContext';
import { ModTierCheckboxes } from './ModTierCheckboxes';
import { ITEM_MODS } from '../data';

interface ModViewProps {
  category: ItemCategory;
  onBack: () => void;
}

export const ModView: React.FC<ModViewProps> = ({ category, onBack }) => {
  const { config, updateConfig, copyModsToAll, copyModsToSpecific } = useFilter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showCopyToMenu, setShowCopyToMenu] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success-all' | 'success-specific'>('idle');
  const copyToMenuRef = useRef<HTMLDivElement>(null);
  
  const itemConfig = config[category];
  const mods = ITEM_MODS[category];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (copyToMenuRef.current && !copyToMenuRef.current.contains(event.target as Node)) {
        setShowCopyToMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (copyStatus !== 'idle') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

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

  const toggleMod = (modId: string, state: 'red' | 'yellow') => {
    const currentFilter = itemConfig.mods[modId] || { D: false, C: false, B: false, A: false, S: false };
    const allOfState = TIERS.every(t => currentFilter[t] === state);
    const newValue: ModState = allOfState ? false : state;
    
    const newConfig = { ...config };
    newConfig[category].mods[modId] = {
      D: newValue, C: newValue, B: newValue, A: newValue, S: newValue
    };
    updateConfig(newConfig);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950 text-gray-200 p-8 pt-20">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        <motion.button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all mb-4 group cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Categories</span>
        </motion.button>

        <header className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{category} Mods & Sockets</h1>
              <p className="text-gray-400">Configure specific mods and socket requirements for {category.toLowerCase()} drops.</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button 
                onClick={() => {
                  copyModsToAll(category);
                  setCopyStatus('success-all');
                }}
                disabled={copyStatus === 'success-all'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 border ${
                  copyStatus === 'success-all' 
                    ? 'bg-green-600/20 text-green-400 border-green-500/50' 
                    : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/30'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {copyStatus === 'success-all' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied to All!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Copy to All</span>
                  </>
                )}
              </motion.button>

              <div className="relative" ref={copyToMenuRef}>
                <motion.button 
                  onClick={() => setShowCopyToMenu(!showCopyToMenu)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 border ${
                    copyStatus === 'success-specific'
                      ? 'bg-green-600/20 text-green-400 border-green-500/50'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {copyStatus === 'success-specific' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy to...</span>
                    </>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${showCopyToMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {showCopyToMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 py-2 overflow-hidden transition-all duration-200 origin-top-right">
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Select target category
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {ITEM_CATEGORIES.filter(cat => cat !== category).map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            copyModsToSpecific(category, cat);
                            setShowCopyToMenu(false);
                            setCopyStatus('success-specific');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span>{cat}</span>
                          <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
              <motion.label 
                key={socket} 
                className="flex items-center space-x-2 cursor-pointer group transition-transform"
                whileTap={{ scale: 0.9 }}
              >
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
                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors select-none">
                  {socket}
                </span>
              </motion.label>
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
                  <motion.label 
                    key={weaponType} 
                    className="flex items-center space-x-3 cursor-pointer group transition-transform"
                    whileTap={{ scale: 0.9 }}
                  >
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
                  </motion.label>
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
              <motion.label 
                className="flex items-center space-x-2 cursor-pointer group transition-transform"
                whileTap={{ scale: 0.9 }}
              >
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
              </motion.label>
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
                              className="font-medium text-gray-300 cursor-pointer hover:text-white select-none text-sm leading-tight transition-all origin-left"
                              onClick={() => toggleMod(mod.id, 'red')}
                              onContextMenu={(e) => { e.preventDefault(); toggleMod(mod.id, 'yellow'); }}
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
