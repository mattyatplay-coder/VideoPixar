
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VeoModel,
} from '../types';
import {
  BuildingIcon,
  MountainIcon,
  PaletteIcon,
  SmileIcon,
} from './icons';

interface Preset {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  params: Partial<GenerateVideoParams>;
}

const presets: Preset[] = [
  {
    id: 'nature',
    title: 'Cinematic Nature',
    description: 'Majestic landscapes with photorealistic lighting',
    icon: <MountainIcon className="w-6 h-6 text-emerald-400" />,
    params: {
      prompt:
        'Aerial drone shot of a majestic waterfall in Iceland, mossy green cliffs, overcast dramatic sky, cinematic 4k.',
      model: VeoModel.VEO,
      aspectRatio: AspectRatio.LANDSCAPE,
    },
  },
  {
    id: 'city',
    title: 'Cyberpunk City',
    description: 'Futuristic urban vibes with neon aesthetics',
    icon: <BuildingIcon className="w-6 h-6 text-purple-400" />,
    params: {
      prompt:
        'Cyberpunk street level view, neon signs reflecting in rain puddles, steam rising from vents, futuristic cars, night time.',
      model: VeoModel.VEO_FAST,
      aspectRatio: AspectRatio.LANDSCAPE,
    },
  },
  {
    id: 'character',
    title: '3D Character',
    description: 'Cute animated characters in studio quality',
    icon: <SmileIcon className="w-6 h-6 text-yellow-400" />,
    params: {
      prompt:
        'A cute fluffy robot with big glowing eyes holding a flower, pixar style, studio lighting, 3d render, high detail.',
      model: VeoModel.VEO_FAST,
      aspectRatio: AspectRatio.PORTRAIT,
    },
  },
  {
    id: 'abstract',
    title: 'Fluid Abstract',
    description: 'Mesmerizing colors and liquid motion',
    icon: <PaletteIcon className="w-6 h-6 text-pink-400" />,
    params: {
      prompt:
        'Swirling colorful ink in water, macro shot, slow motion, vibrant red and blue colors mixing, artistic abstract background.',
      model: VeoModel.VEO_FAST,
      aspectRatio: AspectRatio.LANDSCAPE,
    },
  },
];

interface PresetGalleryProps {
  onSelect: (params: GenerateVideoParams) => void;
}

const PresetGallery: React.FC<PresetGalleryProps> = ({onSelect}) => {
  const handleSelect = (preset: Preset) => {
    const fullParams: GenerateVideoParams = {
      prompt: preset.params.prompt || '',
      model: preset.params.model || VeoModel.VEO_FAST,
      aspectRatio: preset.params.aspectRatio || AspectRatio.LANDSCAPE,
      resolution: Resolution.P720,
      mode: GenerationMode.TEXT_TO_VIDEO,
      startFrame: null,
      endFrame: null,
      referenceImages: [],
      styleImage: null,
      inputVideo: null,
      inputVideoObject: null,
      isLooping: false,
      ...preset.params,
    };
    onSelect(fullParams);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-200 mb-2">
          Start with a Preset
        </h2>
        <p className="text-gray-400">
          Choose a style below or describe your own vision
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset)}
            className="flex items-start gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl transition-all duration-200 group text-left">
            <div className="p-3 bg-gray-700/50 rounded-lg group-hover:bg-gray-700 transition-colors">
              {preset.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-200 group-hover:text-indigo-400 transition-colors">
                {preset.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {preset.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetGallery;
