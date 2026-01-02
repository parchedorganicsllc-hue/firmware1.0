
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { runThinkingAssistant, runSearchAssistant, runMapsAssistant, speakText } from '../services/geminiService';

export const AIChat: React.FC<{ currentModule: string }> = ({ currentModule }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'thinking' | 'search' | 'maps'>('standard');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let result: any;
      if (mode === 'thinking') result = { text: await runThinkingAssistant(input, currentModule) };
      else if (mode === 'search') result = await runSearchAssistant(input);
      else if (mode === 'maps') {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        result = await runMapsAssistant(input, { lat: pos.coords.latitude, lng: pos.coords.longitude });
      } else result = { text: await runThinkingAssistant(input, currentModule) }; // Fallback or standard

      const assistMsg: ChatMessage = { 
        role: 'assistant', 
        content: result.text, 
        sources: result.sources?.map((c: any) => ({ title: c.web?.title || c.maps?.title, uri: c.web?.uri || c.maps?.uri })).filter(Boolean)
      };
      setMessages(prev => [...prev, assistMsg]);
      
      // Auto TTS for assistant
      const buf = await speakText(result.text.slice(0, 100)); // Just 100 chars for brevity
      const ctx = new AudioContext();
      const s = ctx.createBufferSource();
      s.buffer = buf; s.connect(ctx.destination); s.start();

    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-white/5 p-2 px-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex gap-2">
          {['standard', 'thinking', 'search', 'maps'].map(m => (
            <button key={m} onClick={() => setMode(m as any)} className={`text-[8px] mono uppercase px-1.5 py-0.5 border rounded ${mode === m ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/10 text-white/30'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 mono text-[11px] scrollbar-none">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 rounded-lg border ${m.role === 'user' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-50/80' : 'bg-white/5 border-white/10 text-white/70'}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                  <p className="text-[9px] text-white/30 uppercase">References:</p>
                  {m.sources.map((s, idx) => <a key={idx} href={s.uri} target="_blank" className="block text-emerald-500 hover:underline text-[9px] truncate">{s.title || s.uri}</a>)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-black/40 border-t border-white/5">
        <div className="flex gap-2">
          <input 
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="NEURAL_QUERY..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[11px] text-emerald-400 focus:outline-none focus:border-emerald-500/50 mono"
          />
          <button onClick={handleSend} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 rounded-lg mono text-[10px] uppercase">Exec</button>
        </div>
      </div>
    </div>
  );
};
