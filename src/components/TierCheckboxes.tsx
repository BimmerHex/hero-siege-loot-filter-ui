import React from 'react';
import { Tier, TIERS, TierFilter } from '../types';

interface TierCheckboxesProps {
  filter: TierFilter;
  onChange: (tier: Tier, value: boolean) => void;
}

export const TierCheckboxes: React.FC<TierCheckboxesProps> = ({ filter, onChange }) => {
  return (
    <div className="flex space-x-2">
      {TIERS.map((tier) => (
        <label key={tier} className="flex items-center space-x-1 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={filter[tier]}
              onChange={(e) => onChange(tier, e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-6 h-6 rounded bg-gray-800 border border-gray-700 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors flex items-center justify-center group-hover:border-gray-500">
              {filter[tier] && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors w-4 text-center">
            {tier}
          </span>
        </label>
      ))}
    </div>
  );
};
