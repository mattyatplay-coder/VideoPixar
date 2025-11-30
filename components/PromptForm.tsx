
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {enhancePrompt} from '../services/geminiService';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  Scene,
  VeoModel,
  VideoFile,
} from '../types';
import SceneStrip from './SceneStrip';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FilmIcon,
  FramesModeIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  WandIcon,
  XMarkIcon,
} from './icons';

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

// Common keywords for video generation
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

const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64} as T);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> =>
  fileToBase64<VideoFile>(file);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label
      className={`text-xs block mb-1.5 font-medium ${
        disabled ? 'text-gray-500' : 'text-gray-400'
      }`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
        {children}
      </select>
      <ChevronDownIcon
        className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          disabled ? 'text-gray-600' : 'text-gray-400'
        }`}
      />
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, image, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create object URL for preview and cleanup
  const previewUrl = useMemo(() => {
    return image ? URL.createObjectURL(image.file) : null;
  }, [image]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onSelect(imageFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (image && previewUrl) {
    return (
      <div className="relative w-28 h-20 group">
        <img
          src={previewUrl}
          alt="preview"
          className="w-full h-full object-cover rounded-lg"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove image">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-28 h-20 bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors">
      <PlusIcon className="w-6 h-6" />
      <span className="text-xs mt-1 text-center px-1">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </button>
  );
};

const VideoUpload: React.FC<{
  onSelect: (video: VideoFile) => void;
  onSceneSelect: (sceneId: string) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: React.ReactNode;
}> = ({onSelect, onSceneSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Create object URL for preview and cleanup
  const previewUrl = useMemo(() => {
    return video ? URL.createObjectURL(video.file) : null;
  }, [video]);

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

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
  scenes: Scene[];
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
  scenes,
}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(
    initialValues?.model ?? VeoModel.VEO_FAST,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE,
  );
  const [resolution, setResolution] = useState<Resolution>(
    initialValues?.resolution ?? Resolution.P720,
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO,
  );
  const [startFrame, setStartFrame] = useState<ImageFile | null>(
    initialValues?.startFrame ?? null,
  );
  const [endFrame, setEndFrame] = useState<ImageFile | null>(
    initialValues?.endFrame ?? null,
  );
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(
    initialValues?.referenceImages ?? [],
  );
  const [styleImage, setStyleImage] = useState<ImageFile | null>(
    initialValues?.styleImage ?? null,
  );
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(
    initialValues?.inputVideo ?? null,
  );
  const [inputVideoObject, setInputVideoObject] = useState<Video | null>(
    initialValues?.inputVideoObject ?? null,
  );
  const [isLooping, setIsLooping] = useState(initialValues?.isLooping ?? false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  // Sync state with initialValues prop when it changes
  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setModel(initialValues.model ?? VeoModel.VEO_FAST);
      setAspectRatio(initialValues.aspectRatio ?? AspectRatio.LANDSCAPE);
      setResolution(initialValues.resolution ?? Resolution.P720);
      setGenerationMode(initialValues.mode ?? GenerationMode.TEXT_TO_VIDEO);
      setStartFrame(initialValues.startFrame ?? null);
      setEndFrame(initialValues.endFrame ?? null);
      setReferenceImages(initialValues.referenceImages ?? []);
      setStyleImage(initialValues.styleImage ?? null);
      setInputVideo(initialValues.inputVideo ?? null);
      setIsLooping(initialValues.isLooping ?? false);
      
      // Unconditionally sync inputVideoObject from initialValues.
      // This is crucial for Extend Video mode. If initialValues contains it, set it.
      // If it doesn't, allow it to be null (or reset).
      setInputVideoObject(initialValues.inputVideoObject ?? null);
    }
  }, [initialValues]);

  // Adjust model/resolution based on mode
  useEffect(() => {
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      setModel(VeoModel.VEO);
      setAspectRatio(AspectRatio.LANDSCAPE);
      setResolution(Resolution.P720);
    } else if (generationMode === GenerationMode.EXTEND_VIDEO) {
      setResolution(Resolution.P720);
    }
  }, [generationMode]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onGenerate({
        prompt,
        model,
        aspectRatio,
        resolution,
        mode: generationMode,
        startFrame,
        endFrame,
        referenceImages,
        styleImage,
        inputVideo,
        inputVideoObject,
        isLooping,
      });
    },
    [
      prompt,
      model,
      aspectRatio,
      resolution,
      generationMode,
      startFrame,
      endFrame,
      referenceImages,
      styleImage,
      inputVideo,
      inputVideoObject,
      onGenerate,
      isLooping,
    ],
  );

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (error) {
      console.error('Failed to enhance prompt', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const addKeyword = (keyword: string) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return keyword;
      if (trimmed.toLowerCase().includes(keyword.toLowerCase())) return prev;
      return `${trimmed}, ${keyword}`;
    });
  };

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setIsModeSelectorOpen(false);
    // Reset media when mode changes to avoid confusion
    setStartFrame(null);
    setEndFrame(null);
    setReferenceImages([]);
    setStyleImage(null);
    setInputVideo(null);
    setInputVideoObject(null);
    setIsLooping(false);
  };

  const handleSceneDrop = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (scene) {
      const file = new File([scene.blob], `scene-${scene.id}.mp4`, {
        type: scene.blob.type,
      });
      const videoFile = {file, base64: ''};
      setInputVideo(videoFile);
      setInputVideoObject(scene.videoObject);
      
      if (generationMode !== GenerationMode.EXTEND_VIDEO) {
        setGenerationMode(GenerationMode.EXTEND_VIDEO);
      }
    }
  };

  const promptPlaceholder = {
    [GenerationMode.TEXT_TO_VIDEO]: 'Describe the video you want to create...',
    [GenerationMode.FRAMES_TO_VIDEO]:
      'Describe motion between start and end frames (optional)...',
    [GenerationMode.REFERENCES_TO_VIDEO]:
      'Describe a video using reference and style images...',
    [GenerationMode.EXTEND_VIDEO]: 'Describe what happens next (required)...',
  }[generationMode];

  const selectableModes = [
    GenerationMode.TEXT_TO_VIDEO,
    GenerationMode.FRAMES_TO_VIDEO,
    GenerationMode.REFERENCES_TO_VIDEO,
    GenerationMode.EXTEND_VIDEO,
  ];

  const renderMediaUploads = () => {
    if (generationMode === GenerationMode.FRAMES_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <ImageUpload
              label="Start Frame"
              image={startFrame}
              onSelect={setStartFrame}
              onRemove={() => {
                setStartFrame(null);
                setIsLooping(false);
              }}
            />
            {!isLooping && (
              <ImageUpload
                label="End Frame"
                image={endFrame}
                onSelect={setEndFrame}
                onRemove={() => setEndFrame(null)}
              />
            )}
          </div>
          {startFrame && !endFrame && (
            <div className="mt-3 flex items-center">
              <input
                id="loop-video-checkbox"
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              <label
                htmlFor="loop-video-checkbox"
                className="ml-2 text-sm font-medium text-gray-300 cursor-pointer">
                Create a looping video
              </label>
            </div>
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-wrap items-center justify-center gap-2">
          {referenceImages.map((img, index) => (
            <ImageUpload
              key={index}
              image={img}
              label=""
              onSelect={() => {}}
              onRemove={() =>
                setReferenceImages((imgs) => imgs.filter((_, i) => i !== index))
              }
            />
          ))}
          {referenceImages.length < 3 && (
            <ImageUpload
              label="Add Reference"
              onSelect={(img) => setReferenceImages((imgs) => [...imgs, img])}
            />
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col gap-4 transition-all">
          <div className="flex flex-col items-center">
            <VideoUpload
              label={
                <>
                  Input Video
                  <br />
                  (drop scene here or upload)
                </>
              }
              video={inputVideo}
              onSelect={setInputVideo}
              onSceneSelect={handleSceneDrop}
              onRemove={() => {
                setInputVideo(null);
                setInputVideoObject(null);
              }}
            />
          </div>
          
          <div className="border-t border-gray-600 w-full pt-4">
             <p className="text-xs text-gray-400 font-medium mb-3 text-center">Optional Controls</p>
             <div className="flex flex-wrap items-start justify-center gap-3">
                <div className="relative group/frame">
                    <ImageUpload
                      label={
                        <>
                          Target End Frame
                          <br/>
                          (Guide connection)
                        </>
                      }
                      image={endFrame}
                      onSelect={setEndFrame}
                      onRemove={() => setEndFrame(null)}
                    />
                     {endFrame && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max text-[10px] text-emerald-300 bg-emerald-950/90 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-500/30 shadow-lg pointer-events-none animate-in fade-in zoom-in duration-300">
                        <SparklesIcon className="w-3 h-3 text-emerald-400" />
                        <span>Smart Transition</span>
                      </div>
                    )}
                </div>

                <div className="w-px h-20 bg-gray-700 mx-2 hidden sm:block"></div>

                {referenceImages.map((img, index) => (
                  <ImageUpload
                    key={`ref-${index}`}
                    image={img}
                    label=""
                    onSelect={() => {}}
                    onRemove={() =>
                      setReferenceImages((imgs) => imgs.filter((_, i) => i !== index))
                    }
                  />
                ))}
                {referenceImages.length < 3 && (
                  <ImageUpload
                    label={
                      <>
                        Add Character/
                        <br/>
                        Style Reference
                      </>
                    }
                    onSelect={(img) => setReferenceImages((imgs) => [...imgs, img])}
                  />
                )}
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const isRefMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;
  const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;

  let isSubmitDisabled = false;
  let tooltipText = '';

  switch (generationMode) {
    case GenerationMode.TEXT_TO_VIDEO:
      isSubmitDisabled = !prompt.trim();
      if (isSubmitDisabled) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.FRAMES_TO_VIDEO:
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A start frame is required.';
      }
      break;
    case GenerationMode.REFERENCES_TO_VIDEO:
      const hasNoRefs = referenceImages.length === 0;
      const hasNoPrompt = !prompt.trim();
      isSubmitDisabled = hasNoRefs || hasNoPrompt;
      if (hasNoRefs && hasNoPrompt) {
        tooltipText = 'Please add reference image(s) and enter a prompt.';
      } else if (hasNoRefs) {
        tooltipText = 'At least one reference image is required.';
      } else if (hasNoPrompt) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.EXTEND_VIDEO:
      // Extend requires an input video object AND a prompt
      const hasInputFile = !!inputVideo;
      const hasInputObject = !!inputVideoObject;
      const hasNoExtendPrompt = !prompt.trim();
      
      // If we have the file but lost the object (manually uploaded or state lost), we are in an invalid state for extension.
      isSubmitDisabled = !hasInputObject || hasNoExtendPrompt;
      
      if (isSubmitDisabled) {
        if (!hasInputObject) {
           if (hasInputFile) {
               tooltipText = 'Video data lost. Please regenerate or re-select the scene from the gallery.';
           } else {
               tooltipText = 'An input video from a previous generation is required to extend.';
           }
        } else if (hasNoExtendPrompt) {
           tooltipText = 'Please describe what happens next in the prompt.';
        }
      }
      break;
  }

  return (
    <div className="relative w-full">
      {isSettingsOpen && (
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
      )}
      <form onSubmit={handleSubmit} className="w-full">
        {renderMediaUploads()}
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2 bg-[#1f1f1f] border border-gray-600 rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500">
            <div className="relative" ref={modeSelectorRef}>
              <button
                type="button"
                onClick={() => setIsModeSelectorOpen((prev) => !prev)}
                className="flex shrink-0 items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                aria-label="Select generation mode">
                {modeIcons[generationMode]}
                <span className="font-medium text-sm whitespace-nowrap">
                  {generationMode}
                </span>
              </button>
              {isModeSelectorOpen && (
                <div className="absolute bottom-full mb-2 w-60 bg-[#2c2c2e] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-20">
                  {selectableModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleSelectMode(mode)}
                      className={`w-full text-left flex items-center gap-3 p-3 hover:bg-indigo-600/50 ${generationMode === mode ? 'bg-indigo-600/30 text-white' : 'text-gray-300'}`}>
                      {modeIcons[mode]}
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={promptPlaceholder}
              className="flex-grow bg-transparent focus:outline-none resize-none text-base text-gray-200 placeholder-gray-500 max-h-48 py-2"
              rows={1}
            />
            {/* Enhance Button */}
            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !prompt.trim()}
              className={`p-2.5 rounded-full transition-colors ${
                isEnhancing
                  ? 'bg-indigo-900/50 text-indigo-300 animate-pulse'
                  : 'hover:bg-gray-700 text-gray-300 hover:text-indigo-400'
              }`}
              title="Enhance prompt with AI">
              <WandIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`p-2.5 rounded-full hover:bg-gray-700 ${isSettingsOpen ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              aria-label="Toggle settings">
              <SlidersHorizontalIcon className="w-5 h-5" />
            </button>
            <div className="relative group">
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                aria-label="Generate video"
                disabled={isSubmitDisabled}>
                <ArrowRightIcon className="w-5 h-5 text-white" />
              </button>
              {isSubmitDisabled && tooltipText && (
                <div
                  role="tooltip"
                  className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {tooltipText}
                </div>
              )}
            </div>
          </div>
          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-2 px-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => addKeyword(chip)}
                className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-full hover:text-white hover:border-indigo-500/50 hover:bg-gray-700 transition-colors">
                + {chip}
              </button>
            ))}
          </div>
        </div>
        
        {/* Scene Gallery */}
        <SceneStrip scenes={scenes} />

        <p className="text-xs text-gray-500 text-center mt-6 px-4">
          Veo is a paid-only model. You will be charged on your Cloud project. See{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            pricing details
          </a>
          .
        </p>
      </form>
    </div>
  );
};

export default PromptForm;
