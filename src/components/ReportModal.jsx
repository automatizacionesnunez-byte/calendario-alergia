import React, { useState } from 'react';
import { format, parseISO, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Brain, Loader2, AlertCircle, CheckCircle2, Info, Activity, Sparkles, Download, X } from 'lucide-react';

const INTENSITY_LABELS = {
  mild: 'Leve',
  moderate: 'Moderado',
  strong: 'Fuerte'
};

export const generateTextReport = (symptoms, currentMonth, period = {}) => {
  const currentYear = currentMonth.getFullYear();
  const yearLabel = currentYear.toString();
  
  const dayEntries = Object.entries(symptoms)
    .filter(([dateStr]) => parseISO(dateStr).getFullYear() === currentYear)
    .sort(([a], [b]) => a.localeCompare(b));

  if (dayEntries.length === 0) return `Sin registros para el año ${yearLabel}.`;

  let report = `REPORTE TÉCNICO INTEGRAL DE SÍNTOMAS - AÑO ${yearLabel}\n`;
  report += `========================================\n\n`;

  if (period.start || period.end) {
    report += `PERIODO DE ALERGIA:\n`;
    report += `Inicio: ${period.start ? format(parseISO(period.start), 'dd MMMM yyyy', { locale: es }) : 'No definido'}\n`;
    report += `Fin:    ${period.end ? format(parseISO(period.end), 'dd MMMM yyyy', { locale: es }) : 'No definido'}\n`;
    report += `----------------------------------------\n\n`;
  }

  dayEntries.forEach(([dateStr, dayData]) => {
    const logs = dayData.logs || [];
    const comment = dayData.comment || "";
    const tags = dayData.tags || [];

    if (logs.length > 0 || comment || tags.length > 0) {
      const date = format(parseISO(dateStr), 'dd MMM (EEEE)', { locale: es });
      
      let entryText = `- ${date}: `;
      
      if (logs.length > 0) {
        entryText += logs.map(s => {
          const type = s.id.replace(/_/g, ' ').toUpperCase();
          const intensity = INTENSITY_LABELS[s.intensity] || 'Moderado';
          return `${type} (${intensity})`;
        }).join(', ');
      }

      if (tags.length > 0) {
        entryText += ` [TABs: ${tags.join(', ')}]`;
      }

      if (comment) {
        entryText += `\n  NOTA: "${comment}"`;
      }
      
      report += `${entryText}\n`;
    }
  });

  return report;
};

export default function ReportModal({ symptoms, currentMonth, period, onClose }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const reportText = generateTextReport(symptoms, currentMonth, period);

  const analyzeWithAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentYear = currentMonth.getFullYear();
      const filteredSymptoms = Object.fromEntries(
        Object.entries(symptoms).filter(([dateStr]) => parseISO(dateStr).getFullYear() === currentYear)
      );

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: filteredSymptoms })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.details || data.error);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white rounded-[3rem] shadow-3xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100"
      >
        <header className="p-10 border-b border-slate-50 flex items-center justify-between bg-white relative z-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter font-manrope">Análisis Clínico Anual</h3>
            <p className="text-sm text-blue-500 font-black uppercase tracking-[0.4em] mt-2">Resumen Sanitario {format(currentMonth, 'yyyy', { locale: es })}</p>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-rose-50 hover:text-rose-500 rounded-[1.5rem] transition-all group border border-slate-50 shadow-sm">
             <X size={24} className="text-slate-400 group-hover:text-rose-500" />
          </button>
        </header>

        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-slate-50/10 flex flex-col gap-8">
          {/* Analysis Section */}
          <div className="space-y-6">
            {!analysis && !loading && !error && (
              <div className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center gap-8 bg-white/50">
                <div className="relative">
                  <div className="absolute -inset-4 bg-blue-100 blur-2xl rounded-full animate-pulse opacity-40" />
                  <div className="relative p-8 bg-blue-600 text-white rounded-[2.5rem] shadow-2xl shadow-blue-200">
                    <Brain size={56} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Motor de Diagnóstico HealthLog</h4>
                  <p className="text-base text-slate-400 max-w-sm font-medium leading-relaxed">Analizaremos la intensidad de tus síntomas registrados para detectar patrones estacionales y periodos clínicos críticos.</p>
                </div>
                <button 
                  onClick={analyzeWithAI}
                  className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl hover:bg-black transition-all flex items-center gap-4 uppercase text-[11px] tracking-widest active:scale-95"
                >
                  <Sparkles size={18} className="text-blue-400" />
                  Iniciar Análisis Inteligente
                </button>
              </div>
            )}

            {loading && (
              <div className="py-20 flex flex-col items-center justify-center gap-6 text-slate-400">
                <div className="relative">
                   <div className="w-20 h-20 border-4 border-blue-50 rounded-full" />
                   <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Analizando Patrones Clínicos...</p>
              </div>
            )}

            {error && (
              <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex gap-6 text-rose-600 items-center">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-rose-500">
                   <AlertCircle size={32} />
                </div>
                <div className="flex-1">
                  <p className="font-black uppercase tracking-widest text-[10px] mb-1">Error de Sincronización AI</p>
                  <p className="text-sm font-bold opacity-80">{error}</p>
                </div>
                <button onClick={analyzeWithAI} className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200">Reintentar</button>
              </div>
            )}

            {analysis && (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-10 rounded-[3rem] border shadow-xl ${
                    analysis.severity === 'Alta' ? 'bg-rose-50 border-rose-100 text-rose-900' :
                    analysis.severity === 'Media' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                    'bg-emerald-50 border-emerald-100 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-3 mb-3 font-black uppercase text-[10px] tracking-widest opacity-50">
                      <Activity size={16} /> Severidad de Crisis
                    </div>
                    <p className="text-5xl font-black tracking-tighter">{analysis.severity}</p>
                    <div className="mt-8 h-4 bg-white/60 rounded-full overflow-hidden shadow-inner border border-white">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(analysis.severity_score || 5) * 10}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full rounded-full ${
                          analysis.severity === 'Alta' ? 'bg-rose-500' :
                          analysis.severity === 'Media' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col justify-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <CheckCircle2 size={120} className="text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-slate-300 relative z-10">
                      Recuento Estadístico
                    </div>
                    <div className="grid grid-cols-2 gap-10 relative z-10">
                      <div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">Días Críticos</p>
                        <p className="text-5xl font-black text-slate-900">{analysis.stats?.asthma_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">Días Moco</p>
                        <p className="text-5xl font-black text-slate-900">{analysis.stats?.mucus_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-blue-600 text-white rounded-[3.5rem] shadow-2xl shadow-blue-200 space-y-4 relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                     <Brain size={200} />
                  </div>
                  <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.3em] opacity-80 relative z-10">
                    <Sparkles size={16} className="text-blue-200" /> Resumen Diagnóstico
                  </div>
                  <p className="text-2xl font-black leading-[1.15] tracking-tight relative z-10">{analysis.summary}</p>
                </div>

                <div className="p-12 bg-slate-900 text-white rounded-[3.5rem] space-y-6 relative border border-slate-800">
                  <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.3em] text-blue-400">
                    <Info size={16} /> Recomendación Médica
                  </div>
                  <p className="leading-relaxed whitespace-pre-line text-base font-medium text-slate-300">{analysis.advice}</p>
                  <div className="pt-8 border-t border-slate-800">
                    <p className="text-[9px] uppercase tracking-[0.5em] opacity-20 font-black text-center">
                      Analysis Protocol v3.2.1 • Experimental Engine
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-5 px-1">Registros Consolidados</h4>
            <div className="p-8 rounded-[2.5rem] font-mono text-[11px] text-slate-500 bg-white border border-slate-100 max-h-72 overflow-y-auto custom-scrollbar shadow-inner leading-loose">
              <pre className="whitespace-pre-wrap">{reportText}</pre>
            </div>
          </div>
        </div>

        <footer className="p-10 border-t border-slate-50 flex gap-6 bg-white relative z-10">
          <button 
            onClick={() => {
              const blob = new Blob([reportText + (analysis ? `\n\nANALISIS IA:\n${JSON.stringify(analysis, null, 2)}` : '')], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `reporte-clinico-${format(currentMonth, 'yyyy')}.txt`;
              a.click();
            }}
            className="flex-1 py-6 px-10 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl hover:bg-black transition-all font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4"
          >
            <Download size={20} /> Descargar Informe Técnico
          </button>
          <button 
            onClick={onClose}
            className="px-12 py-6 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900"
          >
            Finalizar
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
