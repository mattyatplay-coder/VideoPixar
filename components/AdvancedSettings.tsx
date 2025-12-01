/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  AspectRatio,
  GenerationMode,
  Resolution,
  VeoModel,
} from '../types';
import CustomSelect from './CustomSelect';
import {
  RectangleStackIcon,
  SparklesIcon,
  TvIcon,
} from './icons';

interface AdvancedSettingsProps {
  isOpen: boolean;
  model: VeoModel;
  setModel: (model: VeoModel) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  resolution: Resolution;
  setResolution: (res: Resolution) => void;
  generationMode: GenerationMode;
}

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  isOpen,
  model,
  setModel,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  generationMode,
}) => {
  if (!isOpen) return null;

  const isRefMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;
  const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 shadow-2xl z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CustomSelect
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value as VeoModel)}
          icon={<SparklesIcon className="w-5 h-5 text-gray-400" />}
          disabled={isRefMode}>
          {Object.values(VeoModel).map((modelValue) => (
            <option key={modelValue} value={modelValue}>
              {modelValue}
            </option>
          ))}
        </CustomSelect>
        <CustomSelect
          label="Aspect Ratio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
          icon={<RectangleStackIcon className="w-5 h-5 text-gray-400" />}
          disabled={isRefMode || isExtendMode}>
          {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </CustomSelect>
        <div>
          <CustomSelect
            label="Resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value as Resolution)}
            icon={<TvIcon className="w-5 h-5 text-gray-400" />}
            disabled={isRefMode || isExtendMode}>
            <option value={Resolution.P720}>720p</option>
            <option value={Resolution.P1080}>1080p</option>
          </CustomSelect>
          {resolution === Resolution.P1080 && (
            <p className="text-xs text-yellow-400/80 mt-2">
              1080p videos can't be extended.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;