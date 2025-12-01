
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {enhancePrompt} from '../services/geminiService';
import {
  AspectRatio,
  Character,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  Scene,
  VeoModel,
  VideoFile,
} from '../types';
import AdvancedSettings from './AdvancedSettings';
import CharacterManager from './CharacterManager';
import ImageUpload from './ImageUpload';
import ModeSelector from './ModeSelector';
import SceneStrip from './SceneStrip';
import SuggestionChips from './SuggestionChips';
import VideoUpload from './VideoUpload';
import {
  ArrowRightIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UsersIcon,
  WandIcon,
} from './icons';

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
  scenes: Scene[];
  characters: Character[];
  onAddCharacter: (char: Character) => void;
  onDeleteCharacter: (id: string) => void;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
  scenes,
  characters,
  onAddCharacter,
  onDeleteCharacter,
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
  const [isCharacterManagerOpen, setIsCharacterManagerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      setInputVideoObject(initialValues.inputVideoObject ?? null);
    }
  }, [initialValues]);

  // Failsafe: If in Extend mode, and we have inputVideo but not object, try to restore from initialValues
  useEffect(() => {
    if (
      generationMode === GenerationMode.EXTEND_VIDEO &&
      inputVideo &&
      !inputVideoObject &&
      initialValues?.inputVideoObject
    ) {
      console.log('Restoring missing inputVideoObject from initialValues');
      setInputVideoObject(initialValues.inputVideoObject);
    }
  }, [generationMode, inputVideo, inputVideoObject, initialValues]);

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

  const handleCharacterSelect = (char: Character) => {
    // Append character description to prompt
    setPrompt((prev) => {
      const trimmed = prev.trim();
      const charDescription = `Character: ${char.name} (${char.description})`;
      return trimmed ? `${trimmed}\n\n${charDescription}` : charDescription;
    });

    if (char.avatar) {
      setReferenceImages((prev) => [...prev, char.avatar!]);
      
      if (generationMode === GenerationMode.TEXT_TO_VIDEO) {
         setGenerationMode(GenerationMode.REFERENCES_TO_VIDEO);
      }
    }
  };

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
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
    [GenerationMode.EXTEND_VIDEO]:
      'Describe the specific actions and events that should happen next in the video extension (required)...',
  }[generationMode];

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
           tooltipText = 'Please describe the next steps in the prompt.';
        }
      }
      break;
  }

  return (
    <div className="relative w-full">
      <CharacterManager
        isOpen={isCharacterManagerOpen}
        onClose={() => setIsCharacterManagerOpen(false)}
        characters={characters}
        onAddCharacter={onAddCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onSelectCharacter={handleCharacterSelect}
      />

      <AdvancedSettings
        isOpen={isSettingsOpen}
        model={model}
        setModel={setModel}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        resolution={resolution}
        setResolution={setResolution}
        generationMode={generationMode}
      />

      <form onSubmit={handleSubmit} className="w-full">
        {renderMediaUploads()}
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2 bg-[#1f1f1f] border border-gray-600 rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500">
            <ModeSelector currentMode={generationMode} onSelect={handleSelectMode} />
            
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
              onClick={() => setIsCharacterManagerOpen(true)}
              className={`p-2.5 rounded-full hover:bg-gray-700 ${isCharacterManagerOpen ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              title="Character Control Panel">
              <UsersIcon className="w-5 h-5" />
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
          <SuggestionChips onAddKeyword={addKeyword} />
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
