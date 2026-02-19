import React from 'react';
import { GlassCardProps } from '../types';

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`
        relative overflow-hidden
        bg-glass-surface 
        backdrop-blur-xl 
        backdrop-brightness-75
        border border-white/5
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]
        rounded-sm
        text-warm-white
        ${className}
      `}
    >
        {/* Smoked Glass Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-0"></div>
        
        {/* Subtle Edge Highlight */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 z-20"></div>

        {/* Noise Texture (Very subtle) */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0 mix-blend-overlay" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}>
        </div>
        
        {/* Content */}
        <div className="relative z-10 h-full">
            {children}
        </div>
    </div>
  );
};