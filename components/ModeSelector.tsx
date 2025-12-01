/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { GenerationMode } from '../types';
import {
  FilmIcon,
  FramesModeIcon,
  ReferencesModeIcon,
  TextModeIcon,
} from './icons';

interface ModeSelectorProps {
  currentMode: GenerationMode;
  onSelect: (mode: GenerationMode) => void;
}

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

const selectableModes = [
  GenerationMode.TEXT_TO_VIDEO,
  GenerationMode.FRAMES_TO_VIDEO,
  GenerationMode.REFERENCES_TO_VIDEO,
  GenerationMode.EXTEND_VIDEO,
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (mode: GenerationMode) => {
    onSelect(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex shrink-0 items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
        aria-label="Select generation mode">
        {modeIcons[currentMode]}
        <span className="font-medium text-sm whitespace-nowrap">
          {currentMode}
        </span>
      </button>
      {isOpen && (
        <div className="absolute bottom-full mb-2 w-60 bg-[#2c2c2e] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-20">
          {selectableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSelect(mode)}
              className={`w-full text-left flex items-center gap-3 p-3 hover:bg-indigo-600/50 ${
                currentMode === mode ? 'bg-indigo-600/30 text-white' : 'text-gray-300'
              }`}>
              {modeIcons[mode]}
              <span>{mode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeSelector;