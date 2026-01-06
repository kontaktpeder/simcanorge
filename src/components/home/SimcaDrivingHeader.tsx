import { useState } from 'react';
import simcaRallye from '@/assets/simca-rallye-yellow.png';

export function SimcaDrivingHeader() {
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);

  const handleSpeedBoost = () => {
    if (isSpeedBoost) return;
    setIsSpeedBoost(true);
    setTimeout(() => setIsSpeedBoost(false), 2000);
  };

  return (
    <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-xl mb-8">
      {/* Sky gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100" />
      
      {/* Animated clouds */}
      <div className="absolute top-4 animate-cloud-drift-1">
        <div className="w-20 h-8 bg-white/80 rounded-full blur-sm" />
        <div className="w-12 h-6 bg-white/70 rounded-full blur-sm -mt-4 ml-6" />
      </div>
      <div className="absolute top-8 right-1/4 animate-cloud-drift-2">
        <div className="w-24 h-10 bg-white/70 rounded-full blur-sm" />
        <div className="w-16 h-7 bg-white/60 rounded-full blur-sm -mt-5 ml-8" />
      </div>
      <div className="absolute top-12 right-1/3 animate-cloud-drift-3">
        <div className="w-16 h-6 bg-white/60 rounded-full blur-sm" />
      </div>

      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-b from-gray-600 to-gray-700">
        {/* Road stripes */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex gap-12 animate-road-stripes">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-16 h-2 bg-yellow-400 rounded-sm flex-shrink-0" />
          ))}
        </div>
        {/* Road edge lines */}
        <div className="absolute top-2 left-0 right-0 h-1 bg-white/50" />
        <div className="absolute bottom-2 left-0 right-0 h-1 bg-white/50" />
      </div>

      {/* Exhaust smoke particles */}
      <div className={`absolute bottom-12 md:bottom-16 ${isSpeedBoost ? 'animate-drive-fast' : 'animate-drive'}`}>
        <div className="relative">
          {/* Smoke particles */}
          <div className="absolute -left-8 top-4 flex gap-2">
            <div className="w-4 h-4 bg-gray-400/40 rounded-full animate-smoke-1 blur-[2px]" />
            <div className="w-3 h-3 bg-gray-400/30 rounded-full animate-smoke-2 blur-[2px] -ml-2" />
            <div className="w-5 h-5 bg-gray-400/25 rounded-full animate-smoke-3 blur-[3px] -ml-3" />
            <div className="w-3 h-3 bg-gray-300/20 rounded-full animate-smoke-4 blur-[2px] -ml-2" />
          </div>
        </div>
      </div>

      {/* The Simca car */}
      <div 
        className={`absolute bottom-8 md:bottom-10 cursor-pointer ${isSpeedBoost ? 'animate-drive-fast' : 'animate-drive'}`}
        onClick={handleSpeedBoost}
      >
        <div className="animate-car-bump">
          <img 
            src={simcaRallye} 
            alt="Simca Rallye 2" 
            className="h-20 md:h-28 w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* Wheel spin effect overlays */}
          <div className="absolute bottom-1 left-[18%] w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-dashed border-gray-600/30 animate-wheel-spin" />
          <div className="absolute bottom-1 right-[22%] w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-dashed border-gray-600/30 animate-wheel-spin" />
        </div>
      </div>

      {/* Speed boost indicator */}
      <div className={`absolute bottom-2 right-4 text-xs font-medium transition-opacity duration-300 ${isSpeedBoost ? 'opacity-0' : 'opacity-70'}`}>
        <span className="bg-black/30 text-white px-2 py-1 rounded-full backdrop-blur-sm">
          Klikk for speedboost! 🏁
        </span>
      </div>

      {/* Speed lines when boosting */}
      {isSpeedBoost && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute h-0.5 bg-gradient-to-r from-white/60 to-transparent animate-speed-line"
              style={{
                top: `${30 + i * 10}%`,
                left: '-10%',
                width: '20%',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
