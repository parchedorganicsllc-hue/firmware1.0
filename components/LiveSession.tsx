
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality, Type, FunctionDeclaration, LiveServerMessage } from '@google/genai';
import { ModuleType } from '../types';

interface LiveSessionProps {
  onSwitchModule?: (module: ModuleType) => void;
  onToggleScan?: (active: boolean) => void;
  onToggleGhost?: (active: boolean) => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ 
  onSwitchModule, 
  onToggleScan, 
  onToggleGhost 
}) => {
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef(0);

  // Function Declarations for Voice Control
  const controlFunctions: FunctionDeclaration[] = [
    {
      name: 'switch_module',
      description: 'Switch the active tool module on the OmniStream device.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          module: {
            type: Type.STRING,
            description: 'The name of the module to switch to.',
            enum: Object.values(ModuleType)
          }
        },
        required: ['module']
      }
    },
    {
      name: 'toggle_scan',
      description: 'Start or stop the signal scanning/capture process.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          active: {
            type: Type.BOOLEAN,
            description: 'True to start scanning, false to stop.'
          }
        },
        required: ['active']
      }
    },
    {
      name: 'toggle_ghost_mode',
      description: 'Enable or disable stealth/ghost mode for low-profile operations.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          active: {
            type: Type.BOOLEAN,
            description: 'True to enable ghost mode, false to disable.'
          }
        },
        required: ['active']
      }
    }
  ];

  const startSession = async () => {
    if (isActive) return;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const inputCtx = new AudioContext({ sampleRate: 16000 });
    const outputCtx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = outputCtx;
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
          setIsActive(true);
        },
        onmessage: async (msg: LiveServerMessage) => {
          // Handle Audio Output
          const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio) {
            const binary = atob(audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
            const channel = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channel[i] = dataInt16[i] / 32768.0;
            
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }

          // Handle Function Calls
          if (msg.toolCall) {
            for (const fc of msg.toolCall.functionCalls) {
              console.log('Voice Command Received:', fc.name, fc.args);
              
              let result = "ok";
              if (fc.name === 'switch_module') {
                onSwitchModule?.(fc.args.module as ModuleType);
              } else if (fc.name === 'toggle_scan') {
                onToggleScan?.(fc.args.active as boolean);
              } else if (fc.name === 'toggle_ghost_mode') {
                onToggleGhost?.(fc.args.active as boolean);
              }

              sessionPromise.then(s => s.sendToolResponse({
                functionResponses: {
                  id: fc.id,
                  name: fc.name,
                  response: { result: "success" }
                }
              }));
            }
          }

          if (msg.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => setIsActive(false),
        onerror: () => setIsActive(false)
      },
      config: { 
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: controlFunctions }],
        systemInstruction: `You are the OmniStream Voice Interface, a highly advanced cyber-tool command system. 
        You can control the physical states of the device using tools. 
        Always confirm actions concisely. 
        Modules available: ${Object.values(ModuleType).join(', ')}.
        If the user asks to switch or scan, use the appropriate tool.`
      }
    });
  };

  return (
    <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl mt-3 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Voice_Neural_Link</h3>
          <span className="text-[8px] mono text-emerald-500/40 uppercase">Hands-Free Control</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : 'bg-slate-700'}`} />
      </div>
      
      <button 
        onClick={startSession}
        className={`w-full py-2 border text-[10px] font-bold uppercase transition-all duration-500 mono rounded-md ${
          isActive 
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
            : 'bg-emerald-500/5 border-emerald-500/30 text-emerald-500/60 hover:bg-emerald-500/10 hover:border-emerald-500/50'
        }`}
      >
        {isActive ? 'VOICE_LINK_ACTIVE' : 'INITIALIZE_VOICE_LINK'}
      </button>

      {isActive && (
        <div className="mt-3 flex gap-2 justify-center">
          <div className="w-1 h-3 bg-emerald-500/40 animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-5 bg-emerald-500/60 animate-[bounce_1s_infinite]" style={{ animationDelay: '200ms' }} />
          <div className="w-1 h-4 bg-emerald-500/80 animate-[bounce_1s_infinite]" style={{ animationDelay: '400ms' }} />
          <div className="w-1 h-6 bg-emerald-500/60 animate-[bounce_1s_infinite]" style={{ animationDelay: '600ms' }} />
          <div className="w-1 h-3 bg-emerald-500/40 animate-[bounce_1s_infinite]" style={{ animationDelay: '800ms' }} />
        </div>
      )}
    </div>
  );
};
