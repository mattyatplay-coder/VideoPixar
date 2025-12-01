
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VideoFile } from '../types';
import { fileToVideoFile } from '../utils/fileUtils';
import { PlusIcon, XMarkIcon } from './icons';

interface VideoUploadProps {
  onSelect: (video: VideoFile) => void;
  onSceneSelect: (sceneId: string) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: React.ReactNode;
}

const VideoUpload: React.FC<VideoUploadProps> = ({onSelect, onSceneSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Create object URL for preview
  const previewUrl = useMemo(() => {
    return video ? URL.createObjectURL(video.file) : null;
  }, [video]);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file);
        onSelect(videoFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const sceneId = e.dataTransfer.getData('sceneId');
    if (sceneId) {
      onSceneSelect(sceneId);
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      fileToVideoFile(file).then(onSelect).catch(console.error);
    }
  };

  if (video && previewUrl) {
    return (
      <div className="relative w-48 h-28 group">
        <video
          src={previewUrl}
          muted
          loop
          className="w-full h-full object-cover rounded-lg"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove video">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-48 h-28 bg-gray-700/50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white transition-all text-center
        ${isDragging ? 'border-indigo-500 bg-gray-700 ring-2 ring-indigo-500/50' : 'border-gray-600 hover:bg-gray-700'}`}
    >
      <PlusIcon className="w-6 h-6 mb-1" />
      <span className="text-xs px-2 pointer-events-none">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </button>
  );
};

export default VideoUpload;
