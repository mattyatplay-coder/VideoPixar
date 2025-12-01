/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const SUGGESTION_CHIPS = [
  'Cinematic',
  '4k',
  'Photorealistic',
  'Slow Motion',
  'Drone Shot',
  'Golden Hour',
  'Cyberpunk',
  'Studio Lighting',
  'Macro',
  'Wide Angle',
  'Volumetric Lighting',
  'Bokeh',
];

interface SuggestionChipsProps {
  onAddKeyword: (keyword: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onAddKeyword }) => {
  return (
    <div className="flex flex-wrap gap-2 px-2">
      {SUGGESTION_CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onAddKeyword(chip)}
          className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-full hover:text-white hover:border-indigo-500/50 hover:bg-gray-700 transition-colors">
          + {chip}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;