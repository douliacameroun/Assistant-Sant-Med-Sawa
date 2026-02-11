
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Helper for encoding audio
export function encodePCM(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper for decoding audio
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Using process.env.API_KEY as required by the environment
export const createChatSession = () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({ 
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
};

// Using process.env.API_KEY as required by the environment
export const generateTTS = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// Using process.env.API_KEY as required by the environment
export const connectLiveVoice = (callbacks: {
  onOpen: () => void;
  onMessage: (message: LiveServerMessage) => void;
  onError: (e: any) => void;
  onClose: (e: any) => void;
}) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({ 
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onerror: callbacks.onError,
      onclose: callbacks.onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: SYSTEM_INSTRUCTION,
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });
};
