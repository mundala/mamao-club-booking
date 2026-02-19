import React, { useState } from 'react';

const CROWD_IMAGES = [
  '/images/crowd-1.jpg',
  '/images/crowd-4.jpg',
  '/images/crowd-7.jpg',
  '/images/crowd-10.jpg',
  '/images/crowd-13.jpg',
];

export const DotMatrixGrid: React.FC = () => {
  const [bgImage] = useState(() => CROWD_IMAGES[Math.floor(Math.random() * CROWD_IMAGES.length)]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
      {/* Background Crowd Photo with Slow Zoom */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'slowZoom 20s ease-in-out infinite alternate',
          transformOrigin: 'center center',
        }}
      />

      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-off-black/70"></div>

      {/* Base Grid - Lower opacity for mood */}
      <div className="absolute inset-0 dot-matrix-bg opacity-10"></div>

      {/* Film Grain Layer */}
      <div
        className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-[0.06] mix-blend-overlay z-10"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
            animation: 'grain 8s steps(10) infinite'
        }}
      ></div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(3,3,3,0.95)_100%)] z-20"></div>

      {/* Decorative 'Scanner' Line - Slower and Red */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nothing-red to-transparent opacity-10 animate-[pulse_10s_ease-in-out_infinite] translate-y-[50vh]"></div>
    </div>
  );
};
