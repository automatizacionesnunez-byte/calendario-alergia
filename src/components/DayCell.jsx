import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { MessageSquare, Plus, Droplets, Cloudy, Wind } from 'lucide-react';
import { motion } from 'framer-motion';

const INTENSITY_CONFIG = {
  mild: { weight: 3, opacity: 0.5, scale: 0.9 },
  moderate: { weight: 8, opacity: 0.8, scale: 1.2 },
  strong: { weight: 16, opacity: 1, scale: 1.8 }
};

export default function DayCell({ 
  day, isCurrentMonth, isToday: currentIsToday, dayData, allSymptoms, 
  isStart, isEnd, isSelected, onClick, onMouseDown, onMouseEnter, onMouseUp 
}) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const prevDateStr = format(subDays(day, 1), 'yyyy-MM-dd');
  const nextDateStr = format(addDays(day, 1), 'yyyy-MM-dd');

  const logs = dayData?.logs || [];
  const comment = dayData?.comment || "";
  
  const getSymptomsByCategory = (cat) => logs.filter(s => s.category === cat);
  const hasSymptom = (id) => logs.some(s => s.id === id);
  
  const renderCatarroLine = () => {
    const syms = getSymptomsByCategory('catarro');
    if (syms.length === 0) return null;
    
    // Use highest intensity
    const intensities = ['mild', 'moderate', 'strong'];
    const maxSym = syms.reduce((prev, curr) => 
      intensities.indexOf(curr.intensity) > intensities.indexOf(prev.intensity) ? curr : prev
    );
    
    const config = INTENSITY_CONFIG[maxSym.intensity] || INTENSITY_CONFIG.moderate;
    
    const neighborHas = (date) => {
      const data = allSymptoms[date];
      const dayLogs = data?.logs || [];
      return dayLogs.some(s => s.category === 'catarro');
    };

    const continuous = neighborHas(prevDateStr) || neighborHas(nextDateStr);

    return (
      <div 
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-all duration-300 z-10"
        style={{ top: '35%', height: config.weight }}
      >
          <div 
            className="w-full h-full" 
            style={{ 
              backgroundColor: '#10b981',
              borderStyle: continuous ? 'solid' : 'dashed',
              borderRadius: '99px',
              opacity: config.opacity,
              boxShadow: `0 0 15px rgba(16, 185, 129, 0.4)`
            }} 
          />
      </div>
    );
  };

  const renderMolestiasCircle = () => {
    const syms = getSymptomsByCategory('molestias');
    if (syms.length === 0) return null;

    const intensities = ['mild', 'moderate', 'strong'];
    const maxSym = syms.reduce((prev, curr) => 
      intensities.indexOf(curr.intensity) > intensities.indexOf(prev.intensity) ? curr : prev
    );
    const config = INTENSITY_CONFIG[maxSym.intensity] || INTENSITY_CONFIG.moderate;

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div 
          className="rounded-full border-[#60a5fa] border-4 transition-all duration-500"
          style={{ 
            width: 40 * config.scale,
            height: 40 * config.scale,
            opacity: config.opacity * 0.4,
            filter: `drop-shadow(0 0 8px rgba(96, 165, 250, 0.3))`
          }}
        />
      </div>
    );
  };

  const asmaLogs = getSymptomsByCategory('asma');
  const activeAsma = asmaLogs.length > 0 ? asmaLogs.reduce((prev, curr) => {
    const intensities = ['mild', 'moderate', 'strong'];
    return intensities.indexOf(curr.intensity) > intensities.indexOf(prev.intensity) ? curr : prev
  }) : null;

  const isDeporte = hasSymptom('deporte');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      onClick={() => onClick(dateStr)}
      data-is-today={currentIsToday}
      className={`min-h-[60px] md:min-h-[80px] p-1.5 md:p-2.5 flex flex-col relative transition-all cursor-pointer rounded-lg md:rounded-2xl border ${
        isSelected ? 'bg-blue-50/50 border-[#0058be] ring-2 ring-[#0058be]/10' : 
        isCurrentMonth ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-transparent opacity-20 pointer-events-none'
      } shadow-sm group select-none`}
    >
      <div className="flex items-start justify-between relative z-20">
        <div className={`text-base md:text-xl font-black tracking-tight ${currentIsToday ? 'text-[#0058be]' : 'text-slate-800'}`}>
          {format(day, 'd')}
        </div>
        
        <div className="flex flex-col gap-0.5 items-end">
           {hasSymptom('moqueo') && <Droplets size={10} className="text-blue-400" />}
           {hasSymptom('picor_ojos') && <Cloudy size={10} className="text-purple-400" />}
           {hasSymptom('picor_piel') && <Wind size={10} className="text-purple-600" />}
        </div>
      </div>

      <div className="flex-1 w-full relative mt-1 pointer-events-none">
        {renderCatarroLine()}
        {renderMolestiasCircle()}

        {activeAsma && (
          <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center pointer-events-none z-10">
             <div 
                className="font-black text-[#ef4444] transition-all duration-700 flex items-center gap-1"
                style={{ 
                  fontSize: 20 * (INTENSITY_CONFIG[activeAsma.intensity]?.scale || 1),
                  opacity: (INTENSITY_CONFIG[activeAsma.intensity]?.opacity || 0.7) * 0.9,
                  transform: `rotate(-15deg)`,
                  filter: `drop-shadow(0 4px 10px rgba(239, 68, 68, 0.3))`
                }}
             >
               <span>X</span>
               {isDeporte && <span className="text-[0.4em] mb-[0.6em] font-black underline decoration-4 underline-offset-4">D</span>}
             </div>
          </div>
        )}

        {comment && (
          <div className="mt-auto relative z-20 group-hover:scale-105 transition-transform">
            <div className="text-[8px] font-black text-slate-500 line-clamp-1 bg-slate-50/90 backdrop-blur-sm py-1 px-2 rounded-lg border border-slate-100 uppercase tracking-widest shadow-sm">
               {comment}
            </div>
          </div>
        )}
      </div>

      {isStart && (
        <div className="absolute top-1 right-2 z-30 animate-in zoom-in duration-300">
          <div className="text-[7px] font-black text-[#0058be] px-2 py-0.5 rounded-full border border-[#0058be] uppercase tracking-widest bg-white shadow-lg">INI</div>
        </div>
      )}
      {isEnd && (
        <div className="absolute top-1 right-8 z-30 animate-in zoom-in duration-300">
          <div className="text-[7px] font-black text-rose-500 px-2 py-0.5 rounded-full border border-rose-500 uppercase tracking-widest bg-white shadow-lg">FIN</div>
        </div>
      )}
    </motion.div>
  );
}
