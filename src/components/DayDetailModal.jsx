import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MessageSquare, 
  Mic, 
  Tag as TagIcon, 
  X, 
  Check, 
  RotateCcw,
  Sparkles,
  Wind,
  Droplets,
  Cloudy,
  Activity,
  Zap,
  Clock,
  Circle
} from 'lucide-react';
import { motion } from 'framer-motion';

const QUICK_TAGS = [
  { id: 'polen_alto', label: 'Polen Alto', icon: TagIcon, color: 'text-rose-500' },
  { id: 'aire_acond', label: 'Aire Acondicionado', icon: Wind, color: 'text-cyan-500' },
  { id: 'estres', label: 'Estrés', icon: Zap, color: 'text-amber-500' },
];

const CATARRO_OPTIONS = [ 
  { id: 'moco_verde', label: 'Moco Verde' },
  { id: 'moco_amarillo', label: 'Moco Amarillo' },
  { id: 'tos_seca', label: 'Tos Seca' },
  { id: 'tos_prod', label: 'Tos Productiva' }
];

export default function DayDetailModal({ date, dayData, onSave, onClose, selection }) {
  const [logs, setLogs] = useState(dayData?.logs || []);
  const [comment, setComment] = useState(dayData?.comment || '');
  const [tags, setTags] = useState(dayData?.tags || []);
  const [isListening, setIsListening] = useState(false);

  const isRange = selection && selection.start && selection.end && selection.start !== selection.end;
  const startDate = isRange ? (selection.start < selection.end ? selection.start : selection.end) : date;
  const endDate = isRange ? (selection.start < selection.end ? selection.end : selection.start) : date;

  const toggleSymptom = (id) => {
    const exists = logs.find(l => l.id === id);
    if (exists) {
      const intensities = ['mild', 'moderate', 'strong'];
      const currentIdx = intensities.indexOf(exists.intensity);
      if (currentIdx === 2) {
        setLogs(prev => prev.filter(l => l.id !== id));
      } else {
        setLogs(prev => prev.map(l => l.id === id ? { ...l, intensity: intensities[currentIdx + 1] } : l));
      }
    } else {
      setLogs(prev => [...prev, { id, intensity: 'mild' }]);
    }
  };

  const toggleTag = (tagId) => {
    setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Su navegador no soporta reconocimiento de voz.");
      return;
    }
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-ES';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => setComment(prev => `${prev} ${e.results[0][0].transcript}`);
    recognition.start();
  };

  const hasCatarro = logs.some(l => l.id === 'catarro');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[3rem] shadow-3xl flex flex-col overflow-hidden border border-slate-100 max-h-[90vh]"
      >
        <header className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between bg-white relative z-10">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-none">Registro Clínico</h3>
            <p className="text-[10px] md:text-sm text-[#0058be] font-black uppercase tracking-[0.2em] mt-1.5 md:mt-2">
              {isRange ? (
                `${format(parseISO(startDate), 'd')} - ${format(parseISO(endDate), 'd')} de ${format(parseISO(startDate), 'MMMM yyyy', { locale: es })}`
              ) : (
                format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: es })
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-rose-50 hover:text-rose-500 rounded-xl md:rounded-2xl transition-all border border-slate-50 shadow-sm">
             <X size={18} className="text-slate-400" />
          </button>
        </header>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/20">
          {/* Main Symptom Groups */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 px-1">Sintomatología Principal</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'catarro', label: 'Catarro (Línea)', icon: Activity },
                { id: 'mucosidad', label: 'Mucosidad (Gotas)', icon: Droplets },
                { id: 'picor_ojos', label: 'Picor Ojos (Nube)', icon: Cloudy },
                { id: 'picor_garganta', label: 'Picor Garganta/Piel (Viento)', icon: Wind },
                { id: 'asma', label: 'Asma (Crisis X)', icon: X },
                { id: 'asma_deporte', label: 'Asma Deporte (D)', icon: Zap },
              ].map(sym => {
                const log = logs.find(l => l.id === sym.id);
                return (
                  <div key={sym.id} className="space-y-3">
                    <button
                      onClick={() => toggleSymptom(sym.id)}
                      className={`w-full flex items-center justify-between p-3 md:p-4 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black transition-all border-2 ${
                        log ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-[#0058be] hover:border-opacity-30'
                      }`}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                         <div className={`p-1.5 rounded-lg md:rounded-xl ${log ? 'bg-[#0058be] text-white' : 'bg-slate-50 text-slate-400'}`}>
                            <sym.icon size={16} />
                         </div>
                         <span>{sym.label}</span>
                      </div>
                      {log && (
                        <div className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] uppercase font-black ${
                          log.intensity === 'strong' ? 'bg-[#ef4444]' : log.intensity === 'moderate' ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                        }`}>
                          {log.intensity === 'strong' ? 'F' : log.intensity === 'moderate' ? 'M' : 'L'}
                        </div>
                      )}
                    </button>

                    {/* Sub-options for Catarro */}
                    {sym.id === 'catarro' && log && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-2 px-2 pb-2"
                      >
                        {CATARRO_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => toggleTag(opt.id)}
                            className={`py-2 px-4 rounded-xl text-[10px] font-bold border transition-all ${
                              tags.includes(opt.id) 
                              ? 'bg-[#10b981] bg-opacity-10 border-[#10b981] border-opacity-30 text-[#059669]' 
                              : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contextual Tags */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 px-1">Factores del Entorno</h4>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all border-2 ${
                    tags.includes(tag.id) ? 'bg-[#0058be] border-[#0058be] text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-100'
                  }`}
                >
                  <tag.icon size={14} />
                  {tag.label}
                </button>
              ))}
            </div>
          </section>

          {/* Clinical Notes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Notas de Seguimiento</h4>
              <button 
                onClick={startListening} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black transition-all border ${
                  isListening ? 'bg-rose-500 text-white border-rose-400 animate-pulse' : 'bg-white text-[#0058be] border-blue-50 hover:bg-blue-50'
                }`}
              >
                <Mic size={14} /> {isListening ? 'Escuchando...' : 'Dictar Nota'}
              </button>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describa medicación, evolución o detalles adicionales..."
              className="w-full h-32 p-6 bg-white rounded-[2rem] border-2 border-slate-50 focus:border-[#0058be] focus:border-opacity-30 outline-none transition-all text-sm font-medium text-slate-700 shadow-inner"
            />
          </section>
        </div>

        <footer className="p-4 md:p-6 border-t border-slate-100 bg-white flex gap-3 md:gap-4">
          <button 
            onClick={() => onSave({ logs, comment, tags })}
            className="flex-1 py-3 md:py-4 bg-[#0058be] text-white rounded-xl md:rounded-2xl shadow-xl shadow-blue-200 hover:bg-[#0047a0] transition-all font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-center gap-2 md:gap-3"
          >
            <Check size={16} strokeWidth={3} /> Guardar
          </button>
          <button 
            onClick={() => { setComment(''); setTags([]); setLogs([]); }} 
            className="p-3 md:p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl md:rounded-2xl hover:text-rose-500 hover:bg-rose-50 transition-all"
            title="Borrar Todo"
          >
            <RotateCcw size={18} />
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
