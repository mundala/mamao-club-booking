import React from 'react';

export const StatusBar: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 w-full p-4 border-t border-glass-border flex justify-between items-center text-[10px] sm:text-xs font-mono text-white/40 tracking-widest uppercase z-50 bg-off-black/80 backdrop-blur-md">
      <div className="flex gap-4 items-center overflow-hidden">
        <span className="flex items-center gap-2 min-w-0">
           <span className="w-1.5 h-1.5 bg-nothing-red rounded-full animate-pulse flex-shrink-0"></span>
           <span className="truncate">ADDRESS: 2nd Floor 59-63 Bourke Street, Melbourne</span>
        </span>
        <span className="hidden md:inline opacity-30">|</span>
        <span className="hidden md:inline whitespace-nowrap">TEL: 0422 963 599</span>
      </div>
      <div className="flex gap-4 flex-shrink-0 ml-4 items-center">
        <a href="https://www.instagram.com/mamaoclub.melb/" target="_blank" rel="noopener noreferrer" className="hover:text-nothing-red transition-colors hidden sm:inline">
          IG
        </a>
        <a href="https://www.facebook.com/61560555782062" target="_blank" rel="noopener noreferrer" className="hover:text-nothing-red transition-colors hidden sm:inline">
          FB
        </a>
        <span className="hidden sm:inline opacity-30">|</span>
        <span className="opacity-50">V.2.1.0</span>
      </div>
    </div>
  );
};
