import React from 'react';
import { Tier, TIERS, ModTierFilter, ModState } from '../types';

interface ModTierCheckboxesProps {
  filter: ModTierFilter;
  onChange: (tier: Tier, value: ModState) => void;
}

export const ModTierCheckboxes: React.FC<ModTierCheckboxesProps> = ({ filter, onChange }) => {
  const handleLeftClick = (e: React.MouseEvent, tier: Tier) => {
    e.preventDefault();
    const current = filter[tier];
    if (current === 'red') onChange(tier, false);
    else if (current === 'yellow') onChange(tier, 'red');
    else onChange(tier, 'red');
  };

  const handleRightClick = (e: React.MouseEvent, tier: Tier) => {
    e.preventDefault();
    const current = filter[tier];
    if (current === 'yellow') onChange(tier, false);
    else if (current === 'red') onChange(tier, 'yellow');
    else onChange(tier, 'yellow');
  };

  return (
    <div className="flex space-x-2">
      {TIERS.map((tier) => {
        const state = filter[tier];
        let bgClass = 'bg-gray-800 border-gray-700 group-hover:border-gray-500';
        if (state === 'red') bgClass = 'bg-red-500 border-red-500';
        else if (state === 'yellow') bgClass = 'bg-yellow-500 border-yellow-500';

        return (
          <div 
            key={tier} 
            className="flex items-center space-x-1 cursor-pointer group transition-transform"
            onClick={(e) => handleLeftClick(e, tier)}
            onContextMenu={(e) => handleRightClick(e, tier)}
          >
            <div className="relative flex items-center justify-center">
              <div className={`w-6 h-6 rounded border transition-colors flex items-center justify-center ${bgClass}`}>
                {state && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors w-4 text-center select-none">
              {tier}
            </span>
          </div>
        );
      })}
    </div>
  );
};
