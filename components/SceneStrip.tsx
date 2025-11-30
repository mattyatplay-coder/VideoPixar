
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Scene } from '../types';
import { FilmIcon } from './icons';

interface SceneStripProps {
  scenes: Scene[];
}

const SceneStrip: React.FC<SceneStripProps> = ({ scenes }) => {
  if (scenes.length === 0) return null;

  const handleDragStart = (e: React.DragEvent, scene: Scene) => {
    e.dataTransfer.setData('sceneId', scene.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full mt-8 border-t border-gray-800 pt-6">
      <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
        <FilmIcon className="w-4 h-4 text-indigo-400" />
        Recent Scenes (Drag to Extend)
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            draggable
            onDragStart={(e) => handleDragStart(e, scene)}
            className="flex-shrink-0 w-48 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all relative group shadow-lg"
          >
             <div className="aspect-video relative">
               <video
                  src={scene.url}
                  className="w-full h-full object-cover pointer-events-none"
                  muted
               />
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-xs text-white font-medium bg-indigo-600/90 px-2 py-1 rounded shadow-sm backdrop-blur-sm">Drag to Extend</span>
               </div>
             </div>
             <div className="p-2">
               <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                 {scene.prompt || "Untitled Scene"}
               </p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SceneStrip;
