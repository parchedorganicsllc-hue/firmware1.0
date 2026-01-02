
import React from 'react';
import { ModuleType } from '../types';

interface ModuleCardProps {
  type: ModuleType;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  status: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ type, icon, active, onClick, status }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 ${
        active 
          ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
          : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
      }`}
    >
      <div className={`mb-2 ${active ? 'text-cyan-400' : 'text-slate-400'}`}>
        {icon}
      </div>
      <span className={`text-sm font-semibold ${active ? 'text-cyan-500' : 'text-slate-300'}`}>
        {type}
      </span>
      <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
        {status}
      </span>
      {active && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
        </div>
      )}
    </button>
  );
};
