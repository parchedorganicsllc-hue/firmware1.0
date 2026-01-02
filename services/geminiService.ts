
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const runThinkingAssistant = async (prompt: string, context?: string): Promise<string> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are the OmniStream Neural Core. Thinking enabled. Deep analyze: ${context}`,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text || "Thinking complete. No output.";
  } catch (e) { return "ERROR IN NEURAL FISSURE."; }
};

export const runSearchAssistant = async (prompt: string): Promise<{ text: string, sources: any[] }> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { text: response.text || "", sources };
};

export const runMapsAssistant = async (prompt: string, coords?: { lat: number, lng: number }): Promise<{ text: string, sources: any[] }> => {
  const ai = getAIInstance();
  const config: any = { tools: [{ googleMaps: {} }] };
  if (coords) {
    config.toolConfig = { retrievalConfig: { latLng: { latitude: coords.lat, longitude: coords.lng } } };
  }
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config
  });
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { text: response.text || "", sources };
};

export const generateNeuralImage = async (prompt: string, aspectRatio: string, imageSize: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio, imageSize } as any }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated");
};

export const generateNeuralVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
  const ai = getAIInstance();
  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
  };
  if (imageBase64) {
    payload.image = { imageBytes: imageBase64.split(',')[1], mimeType: 'image/png' };
  }
  
  let operation = await ai.models.generateVideos(payload);
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Transcribe the following audio exactly." },
        { inlineData: { mimeType: 'audio/wav', data: base64Audio } }
      ]
    }
  });
  return response.text || "";
};

export const speakText = async (text: string): Promise<AudioBuffer> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("TTS Failed");
  
  const ctx = new AudioContext();
  return await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
};

// Utils for audio
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
