
import React, { useState, useEffect, useCallback } from 'react';
import { ModuleType, SignalData, HistoryItem } from './types';
import { ModuleCard } from './components/ModuleCard';
import { ProtocolVisualizer } from './components/ProtocolVisualizer';
import { AIChat } from './components/AIChat';
import { MediaLab } from './components/MediaLab';
import { LiveSession } from './components/LiveSession';

const Icons = {
  SubGhz: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Nfc: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v1m0 0a10.003 10.003 0 01-5.713 1.892L6 6m6-1a10.003 10.003 0 015.713 1.892L18 6M8 8a2 2 0 114 0 2 2 0 01-4 0z" /></svg>,
  Rfid: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Infrared: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Bluetooth: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Wifi: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 6.636L12 13m0 0l6.364-6.364M12 13V21m0 0H7m5 0h5" /></svg>,
  Gpio: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
  NeuralLab: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86 3.86l-.477 2.387a2 2 0 001.97 2.387h.047a2 2 0 001.97-1.613l.477-2.387a2 2 0 011.287-1.287l2.387-.477a2 2 0 000-3.847l-2.387-.477z" /></svg>
};

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.SUB_GHZ);
  const [isScanning, setIsScanning] = useState(false);
  const [signalData, setSignalData] = useState<SignalData[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [ghostMode, setGhostMode] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isScanning) { setSignalData([]); return; }
    let t = 0;
    const interval = setInterval(() => {
      setSignalData(prev => {
        let value = Math.sin(t / 2) * Math.cos(t / 5) + (Math.random() - 0.5) * 0.2;
        const newData = [...prev, { timestamp: t++, value }];
        return newData.length > 60 ? newData.slice(1) : newData;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isScanning]);

  const addLog = useCallback((action: string, data: string) => {
    const newItem: HistoryItem = { id: Math.random().toString(36).substring(2, 9), type: activeModule, action, timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }), data };
    setHistory(h => [newItem, ...h].slice(0, 100));
  }, [activeModule]);

  // Voice Callbacks
  const handleVoiceSwitchModule = useCallback((module: ModuleType) => {
    setActiveModule(module);
    addLog('VOICE_CMD', `Switching to ${module} via Neural Link`);
  }, [addLog]);

  const handleVoiceToggleScan = useCallback((active: boolean) => {
    setIsScanning(active);
    addLog('VOICE_CMD', `${active ? 'Starting' : 'Stopping'} capture sequence`);
  }, [addLog]);

  const handleVoiceToggleGhost = useCallback((active: boolean) => {
    setGhostMode(active);
    addLog('VOICE_CMD', `${active ? 'Enabling' : 'Disabling'} Ghost Mode protocol`);
  }, [addLog]);

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-all duration-700 ${ghostMode ? 'bg-black text-green-900 grayscale' : 'bg-[#020617] text-emerald-50'}`}>
      <header className="h-14 border-b border-white/5 bg-white/5 backdrop-blur-xl flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-5">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center border transition-all ${ghostMode ? 'border-green-900' : 'bg-emerald-500 border-emerald-400'}`}><span className="font-bold text-lg">Ø</span></div>
          <h1 className={`text-sm font-bold tracking-widest uppercase ${ghostMode ? 'text-green-900' : 'text-emerald-400 glow-green'}`}>OmniStream CFW</h1>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={() => setGhostMode(!ghostMode)} className="text-[10px] mono border px-2 py-0.5 rounded transition-all">{ghostMode ? '[ GHOST_ON ]' : '[ GHOST_OFF ]'}</button>
          <div className="text-right mono"><div className="text-xs font-bold">{time.toLocaleTimeString()}</div></div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden grid grid-cols-12 gap-3 p-3">
        <div className="col-span-12 lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-2 scrollbar-none">
          {Object.values(ModuleType).map((type) => (
            <ModuleCard key={type} type={type} icon={Icons[type.replace('-','').replace(' ','') as keyof typeof Icons]?.() || <Icons.SubGhz />} active={activeModule === type} onClick={() => setActiveModule(type)} status={activeModule === type ? "ACTIVE" : "STANDBY"} />
          ))}
          <LiveSession 
            onSwitchModule={handleVoiceSwitchModule}
            onToggleScan={handleVoiceToggleScan}
            onToggleGhost={handleVoiceToggleGhost}
          />
        </div>

        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 overflow-hidden">
          {activeModule === ModuleType.NEURAL_LAB ? <MediaLab /> : (
            <>
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl relative p-5 flex flex-col min-h-0 shadow-inner group">
                <div className="absolute top-4 left-5 flex items-center gap-4 z-10">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] mono text-emerald-400/80 uppercase tracking-widest">{activeModule}_ANALYZER</span>
                </div>
                <div className="flex-1 mt-6"><ProtocolVisualizer data={signalData} color={ghostMode ? '#064e3b' : '#10b981'} /></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button onClick={() => { setIsScanning(!isScanning); addLog(isScanning ? 'STOP' : 'START', `Scanning range...`); }} className={`py-3 rounded-lg font-bold uppercase tracking-widest text-[11px] mono border ${isScanning ? 'bg-red-950/20 border-red-500 text-red-500' : 'bg-emerald-950/20 border-emerald-500 text-emerald-500'}`}>{isScanning ? 'HALT_CAPTURE' : 'EXEC_SCAN'}</button>
                  <button className="bg-white/5 border border-white/10 text-white/50 py-3 rounded-lg font-bold uppercase tracking-widest text-[11px] mono">DECODE_BUFFER</button>
                </div>
              </div>
              <div className="h-40 bg-black/60 border border-white/5 rounded-xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 mono text-[10px] space-y-1">
                  {history.map((item) => <div key={item.id} className="flex gap-4 opacity-60"><span className="text-white/20">{item.timestamp}</span><span className="text-emerald-500">[{item.type}]</span><span className="text-white/40">{item.action}:</span><span className="text-white/80">{item.data}</span></div>)}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="col-span-12 lg:col-span-3 overflow-hidden">
          <AIChat currentModule={activeModule} />
        </div>
      </main>

      <footer className="h-7 bg-black border-t border-white/5 px-6 flex items-center justify-between text-[9px] mono text-white/20 uppercase tracking-[0.3em]">
        <div className="flex gap-6"><span>FREQ: 433.92MHZ</span><span>BAT: 88%</span></div>
        <div>OMNISTREAM_STABLE_6.4.2 // NEURAL_ENGINE_CONNECTED</div>
      </footer>
    </div>
  );
};

export default App;
