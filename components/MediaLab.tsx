
import React, { useState } from 'react';
import { generateNeuralImage, generateNeuralVideo } from '../services/geminiService';
import { AspectRatio, ImageSize } from '../types';

export const MediaLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [size, setSize] = useState<ImageSize>('1K');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [type, setType] = useState<'image' | 'video'>('image');
  const [baseImage, setBaseImage] = useState<string | null>(null);

  const handleGen = async () => {
    setIsGenerating(true);
    try {
      if (!await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
      }
      const url = type === 'image' 
        ? await generateNeuralImage(prompt, aspect, size)
        : await generateNeuralVideo(prompt, baseImage || undefined, aspect as any);
      setMediaUrl(url);
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setBaseImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border border-white/5 rounded-xl p-5 space-y-4 overflow-y-auto scrollbar-none">
      <header className="flex justify-between items-center">
        <h2 className="text-xs font-bold tracking-widest text-emerald-400 uppercase">NEURAL_MEDIA_LAB</h2>
        <div className="flex gap-2">
          {['image', 'video'].map(t => (
            <button key={t} onClick={() => setType(t as any)} className={`px-2 py-1 text-[9px] mono border rounded ${type === t ? 'bg-emerald-500 text-black border-emerald-500' : 'text-emerald-500/50 border-emerald-500/20'}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        <textarea 
          value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="ENTER_VISUAL_PROMPT..."
          className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-xs mono text-emerald-100 focus:outline-none focus:border-emerald-500/50"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] mono text-white/30 uppercase">Aspect_Ratio</label>
            <select value={aspect} onChange={e => setAspect(e.target.value as any)} className="w-full bg-black border border-white/10 text-[10px] mono text-emerald-400 p-1 rounded">
              {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {type === 'image' ? (
            <div className="space-y-1">
              <label className="text-[9px] mono text-white/30 uppercase">Output_Scale</label>
              <select value={size} onChange={e => setSize(e.target.value as any)} className="w-full bg-black border border-white/10 text-[10px] mono text-emerald-400 p-1 rounded">
                {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[9px] mono text-white/30 uppercase">Initial_Frame</label>
              <input type="file" onChange={onFile} className="text-[9px] mono text-emerald-500" />
            </div>
          )}
        </div>

        <button 
          onClick={handleGen} disabled={isGenerating}
          className="w-full py-3 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold uppercase mono hover:bg-emerald-600/40 disabled:opacity-20 transition-all"
        >
          {isGenerating ? 'RENDER_IN_PROGRESS...' : `EXEC_GENERATE_${type.toUpperCase()}`}
        </button>
      </div>

      <div className="flex-1 min-h-[200px] border border-white/5 rounded-xl bg-black/60 overflow-hidden flex items-center justify-center">
        {mediaUrl ? (
          type === 'image' ? <img src={mediaUrl} className="max-w-full max-h-full object-contain" /> : <video src={mediaUrl} controls className="max-w-full max-h-full" />
        ) : (
          <span className="text-[10px] mono text-white/10 uppercase italic">Awaiting_Neural_Reconstruction</span>
        )}
      </div>
    </div>
  );
};
