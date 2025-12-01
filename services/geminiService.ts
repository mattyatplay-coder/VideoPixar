
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {AspectRatio, GenerateVideoParams, GenerationMode, Resolution, VeoModel} from '../types';

interface VideoGenerationConfig {
  numberOfVideos: number;
  resolution: Resolution;
  aspectRatio?: AspectRatio;
  referenceImages?: VideoGenerationReferenceImage[];
  lastFrame?: {
    imageBytes: string;
    mimeType: string;
  };
}

interface GenerateVideosParameters {
  model: string;
  config: VideoGenerationConfig;
  prompt?: string;
  image?: {
    imageBytes: string;
    mimeType: string;
  };
  video?: Video;
}

export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  console.log('Starting video generation with params:', params);

  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const config: VideoGenerationConfig = {
    numberOfVideos: 1,
    resolution: params.resolution,
  };

  // Conditionally add aspect ratio. It's not used for extending videos.
  if (params.mode !== GenerationMode.EXTEND_VIDEO) {
    config.aspectRatio = params.aspectRatio;
  }

  // Force Veo 3.1 Pro (not fast) if reference images are present, 
  // as per best practices (or requirement) for multimodal inputs.
  let model = params.model;
  if (params.referenceImages && params.referenceImages.length > 0) {
      model = VeoModel.VEO; // 'veo-3.1-generate-preview'
  }

  // Handle Last Frame Logic (Common to FRAMES mode and EXTEND mode)
  // We calculate this early so we can use it to modify the prompt if needed.
  // For Frames mode: it's the target end frame or start frame (if looping).
  // For Extend mode: it's an optional guide for the extension.
  const endFrame = (params.mode === GenerationMode.FRAMES_TO_VIDEO && params.isLooping)
      ? params.startFrame
      : params.endFrame;

  const generateVideoPayload: GenerateVideosParameters = {
    model: model,
    config: config,
  };

  // Only add the prompt if it's not empty.
  if (params.prompt) {
    let finalPrompt = params.prompt;
    
    // Auto-enhance prompt for Extend Video with End Frame to ensure smooth transition
    if (params.mode === GenerationMode.EXTEND_VIDEO && endFrame) {
       console.log('Adding smooth transition instruction to prompt');
       finalPrompt += ". The video must seamlessly transition from the input video to the provided last frame. Correct any inconsistencies between the input video's end and the target frame so the camera moves in one unified approach to the final frame.";
    }

    generateVideoPayload.prompt = finalPrompt;
  }

  // Handle Reference Images (Common to REF mode and EXTEND mode)
  if (params.mode === GenerationMode.REFERENCES_TO_VIDEO || params.mode === GenerationMode.EXTEND_VIDEO) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        console.log(`Adding reference image: ${img.file.name}`);
        referenceImagesPayload.push({
          image: {
            imageBytes: img.base64,
            mimeType: img.file.type,
          },
          referenceType: VideoGenerationReferenceType.ASSET,
        });
      }
    }

    if (params.styleImage) {
      console.log(
        `Adding style image as a reference: ${params.styleImage.file.name}`,
      );
      referenceImagesPayload.push({
        image: {
          imageBytes: params.styleImage.base64,
          mimeType: params.styleImage.file.type,
        },
        referenceType: VideoGenerationReferenceType.STYLE,
      });
    }

    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }
  }

  // Add Last Frame to payload if it exists
  if (endFrame) {
      if (params.mode === GenerationMode.FRAMES_TO_VIDEO || params.mode === GenerationMode.EXTEND_VIDEO) {
        generateVideoPayload.config.lastFrame = {
            imageBytes: endFrame.base64,
            mimeType: endFrame.file.type,
        };
        console.log(`Generating with last frame: ${endFrame.file.name}`);
      }
  }

  // Handle Mode Specific Inputs (Start Image vs Input Video)
  if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
      console.log(
        `Generating with start frame: ${params.startFrame.file.name}`,
      );
    }
  } else if (params.mode === GenerationMode.EXTEND_VIDEO) {
    if (params.inputVideoObject) {
      generateVideoPayload.video = params.inputVideoObject;
      console.log(`Generating extension from input video object:`, params.inputVideoObject);
    } else {
      throw new Error('An input video object is required to extend a video.');
    }
  }

  console.log('Submitting video generation request...', generateVideoPayload);
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Video generation operation started:', operation);

  const MAX_ATTEMPTS = 60; // 10 minutes (60 * 10s)
  let attempts = 0;

  while (!operation.done && attempts < MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation: operation});
    attempts++;
  }

  if (!operation.done) {
     throw new Error('Video generation timed out after 10 minutes. Please try again.');
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      throw new Error('Video generation completed but no videos were returned. This may indicate an issue with the API or the request parameters.');
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('Generated video is missing a URI.');
    }
    const videoObject = firstVideo.video;

    const url = decodeURIComponent(videoObject.uri);
    console.log('Fetching video from:', url);

    const res = await fetch(`${url}&key=${process.env.API_KEY}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }

    const videoBlob = await res.blob();
    const objectUrl = URL.createObjectURL(videoBlob);

    return {objectUrl, blob: videoBlob, uri: url, video: videoObject};
  } else {
    console.error('Operation failed:', operation);
    throw new Error('No videos generated.');
  }
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  // Use gemini-2.5-flash for fast text enhancement
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an expert prompt engineer for video generation AI. Rewrite the following user prompt to be more descriptive, visual, and detailed to produce a high-quality video. Focus on lighting, camera angles, texture, and motion. Keep it concise (max 3 sentences). Output ONLY the enhanced prompt.

    User Prompt: ${prompt}`,
  });
  return response.text || prompt;
};
