import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, isSameMonth, parseISO, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  FileText, 
  Activity, 
  Circle, 
  X, 
  Zap, 
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  Bell,
  MessageSquare,
  CircleEllipsis,
  FileDown,
  Sparkles,
  Droplets,
  Cloudy,
  Wind
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { loadSymptoms, saveSymptoms, loadPeriod, savePeriod } from './utils/storage';
import CalendarGrid from './components/CalendarGrid';
import ReportModal from './components/ReportModal';
import DayDetailModal from './components/DayDetailModal';
import YearlyPDFViewer from './components/YearlyPDFViewer';

const VAPID_PUBLIC_KEY = 'BKXMg2xUwJrRS9Pw9_ZLKA1T6vUrZ0GobAJS8z1qivf6bjsEtZz9tOsQpdfpnNQi5_BGmM63LQUjmP38Psbutk8';

const TOOLS = [
  { id: 'catarro', label: 'Catarro (Línea)', icon: Activity, color: 'text-emerald-500' },
  { id: 'mucosidad', label: 'Mucosidad (Estornudos)', icon: Droplets, color: 'text-blue-400' },
  { id: 'picor_ojos', label: 'Picor Ojos', icon: Cloudy, color: 'text-purple-400' },
  { id: 'picor_garganta', label: 'Picor Garganta/Piel', icon: Wind, color: 'text-purple-600' },
  { id: 'asma', label: 'Asma (Equis)', icon: X, color: 'text-rose-500' },
  { id: 'asma_deporte', label: 'Asma Deporte (X+D)', icon: Zap, color: 'text-rose-600' },
  { id: 'inicio', label: 'Marcar Inicio', icon: CheckCircle2, color: 'text-[#0058be]' },
  { id: 'fin', label: 'Marcar Fin', icon: Trash2, color: 'text-rose-500' }
];

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTool, setSelectedTool] = useState(null);
  const [symptoms, setSymptoms] = useState(loadSymptoms() || {});
  const [period, setPeriod] = useState(loadPeriod() || { start: null, end: null });
  const [showReport, setShowReport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDetailDay, setSelectedDetailDay] = useState(null);
  const [notifConfig, setNotifConfig] = useState({ active: true, time: '21:00' });
  const [selection, setSelection] = useState({ start: null, end: null, isSelecting: false });

  useEffect(() => {
    saveSymptoms(symptoms);
  }, [symptoms]);

  useEffect(() => {
    savePeriod(period);
  }, [period]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW Registered', reg))
        .catch(err => console.error('SW Registration Failed', err));
    }
  }, []);

  const subscribeToPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permiso de notificaciones denegado.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      if (response.ok) {
        setNotifConfig(prev => ({ ...prev, active: true }));
        alert('¡Notificaciones activadas correctamente!');
      } else {
        throw new Error('Error al guardar la suscripción');
      }
    } catch (error) {
      console.error('Error in push subscription:', error);
      alert('Error al activar las notificaciones. Asegúrate de estar en un entorno seguro (HTTPS).');
    }
  };

  const toggleSymptom = (dateStr) => {
    if (selectedTool === 'inicio') {
      setPeriod(prev => ({ ...prev, start: prev.start === dateStr ? null : dateStr }));
      return;
    }
    if (selectedTool === 'fin') {
      setPeriod(prev => ({ ...prev, end: prev.end === dateStr ? null : dateStr }));
      return;
    }

    if (!selectedTool) {
      setSelectedDetailDay(dateStr);
      return;
    }

    setSymptoms(prev => {
      const dayData = prev[dateStr] || { logs: [], comment: "", tags: [] };
      const logs = dayData.logs || [];
      const currentSymptom = logs.find(s => s.id === selectedTool);
      
      let updatedLogs;
      if (!currentSymptom) {
        updatedLogs = [...logs, { id: selectedTool, intensity: 'mild' }];
      } else {
        const intensities = ['mild', 'moderate', 'strong'];
        const currentIdx = intensities.indexOf(currentSymptom.intensity);
        if (currentIdx === 2) {
          updatedLogs = logs.filter(s => s.id !== selectedTool);
        } else {
          updatedLogs = logs.map(s => s.id === selectedTool ? { ...s, intensity: intensities[currentIdx + 1] } : s);
        }
      }

      return {
        ...prev,
        [dateStr]: { ...dayData, logs: updatedLogs }
      };
    });
  };

  const saveDayDetail = (details) => {
    const range = selection.start && selection.end ? getDatesInRange(selection.start, selection.end) : [selectedDetailDay];
    
    setSymptoms(prev => {
      const updated = { ...prev };
      range.forEach(date => {
        updated[date] = {
          ...(prev[date] || { logs: [], comment: "", tags: [] }),
          ...details
        };
      });
      return updated;
    });
    setSelectedDetailDay(null);
    setSelection({ start: null, end: null, isSelecting: false });
  };

  const getDatesInRange = (start, end) => {
    const dates = [];
    const startDate = new Date(start < end ? start : end);
    const endDate = new Date(start < end ? end : start);
    
    const currDate = new Date(startDate);
    while (currDate <= endDate) {
      dates.push(format(currDate, 'yyyy-MM-dd'));
      currDate.setDate(currDate.getDate() + 1);
    }
    return dates;
  };

  const onSelectionStart = (dateStr) => {
    if (['inicio', 'fin'].includes(selectedTool)) return;
    setSelection({ start: dateStr, end: dateStr, isSelecting: true });
  };

  const onSelectionEnter = (dateStr) => {
    if (selection.isSelecting) {
      setSelection(prev => ({ ...prev, end: dateStr }));
    }
  };

  const onSelectionEnd = () => {
    if (selection.isSelecting) {
      setSelectedDetailDay(selection.start);
      setSelection(prev => ({ ...prev, isSelecting: false }));
    }
  };

  const handleDayClick = (dateStr) => {
    const isMarkerTool = ['inicio', 'fin', 'catarro', 'mucosidad', 'picor_ojos', 'picor_garganta', 'asma', 'asma_deporte'].includes(selectedTool);
    if (isMarkerTool) {
      toggleSymptom(dateStr);
    } else {
      setSelectedDetailDay(dateStr);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
    console.log("Mes Anterior clickeado");
  };
  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
    console.log("Mes Siguiente clickeado");
  };

  const exportPDF = async () => {
    const container = document.getElementById('pdf-export-container');
    if (!container) return;
    container.style.display = 'block';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const canvas1 = await html2canvas(document.getElementById('pdf-page-1'), { scale: 1.5 });
    const img1 = canvas1.toDataURL('image/png');
    pdf.addImage(img1, 'PNG', 0, 0, pdfWidth, (canvas1.height * pdfWidth) / canvas1.width);
    pdf.addPage();
    const canvas2 = await html2canvas(document.getElementById('pdf-page-2'), { scale: 1.5 });
    const img2 = canvas2.toDataURL('image/png');
    pdf.addImage(img2, 'PNG', 0, 0, pdfWidth, (canvas2.height * pdfWidth) / canvas2.width);
    pdf.save(`Allergy-History-${currentMonth.getFullYear()}.pdf`);
    container.style.display = 'none';
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-outfit overflow-hidden p-4 gap-4">
      <AnimatePresence>
        {showReport && (
          <ReportModal symptoms={symptoms} currentMonth={currentMonth} period={period} onClose={() => setShowReport(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDetailDay && (
          <DayDetailModal
            date={selectedDetailDay}
            dayData={symptoms[selectedDetailDay]}
            onSave={saveDayDetail}
            onClose={() => {
              setSelectedDetailDay(null);
              setSelection({ start: null, end: null, isSelecting: false });
            }}
            selection={selection}
          />
        )}
      </AnimatePresence>
      
      <aside className={`bg-white border border-slate-100 rounded-[2.5rem] p-6 flex flex-col gap-8 transition-all duration-500 shadow-2xl relative z-20 ${sidebarOpen ? 'w-[320px]' : 'w-24 overflow-hidden shrink-0'}`}>
        <div className="flex items-center gap-4 px-2">
           <div className="relative">
              <div className="absolute -inset-1.5 bg-[#0058be] blur rounded-full animate-pulse opacity-20" />
              <div className="relative p-3 bg-gradient-to-br from-[#0058be] to-[#0047a0] rounded-2xl shadow-lg shadow-blue-200">
                 <CalendarIcon className="text-white w-6 h-6 shrink-0" />
              </div>
           </div>
           {sidebarOpen && (
             <div className="flex flex-col animate-fade-in">
                <h1 className="text-xl font-black tracking-tight leading-none text-[#0058be]">HealthLog</h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Soporte Clínico</span>
             </div>
           )}
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto pr-1 no-scrollbar">
          {sidebarOpen && (
            <section className="space-y-4 animate-fade-in">
              <div className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-[2rem] space-y-3 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <Activity size={48} className="text-[#0058be]" />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actividad Clínica</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-[#0058be]">
                    {Object.values(symptoms).filter(day => (day.logs?.length > 0) || day.comment || (day.tags?.length > 0)).length}
                  </p>
                  <span className="text-slate-400 font-bold text-sm">Días</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Registros en el año {currentMonth.getFullYear()}.</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-[2rem] space-y-3 relative overflow-hidden shadow-sm group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <Clock size={48} className="text-[#0058be]" />
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo Crítico</h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between group/p">
                       <p className="text-sm font-black flex items-center gap-2 text-emerald-500">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         {period.start ? format(parseISO(period.start), 'dd MMM yyyy', { locale: es }) : 'No definido'}
                       </p>
                    </div>
                    <div className="flex items-center justify-between group/p">
                       <p className="text-sm font-black flex items-center gap-2 text-rose-500">
                         <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                         {period.end ? format(parseISO(period.end), 'dd MMM yyyy', { locale: es }) : 'No definido'}
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2 ${!sidebarOpen && 'text-center'}`}>Herramientas</p>
            <div className="space-y-2">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(prev => prev === tool.id ? null : tool.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative overflow-hidden group ${
                    selectedTool === tool.id 
                    ? 'bg-gradient-to-r from-[#0058be] to-[#0047a0] text-white shadow-xl shadow-blue-200' 
                    : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <tool.icon size={20} className={`shrink-0 ${selectedTool === tool.id ? 'text-white' : 'text-slate-400 group-hover:text-[#0058be]'}`} />
                  {sidebarOpen && <span className="font-bold text-sm truncate">{tool.label}</span>}
                </button>
              ))}
            </div>
          </section>

          {sidebarOpen && (
            <section className="animate-fade-in pt-4 border-t border-slate-100 flex flex-col gap-3">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 px-2">Análisis</p>
               <button 
                onClick={() => setShowReport(true)}
                className="w-full flex items-center gap-3 px-6 py-4 bg-white border border-[#0058be]/20 text-[#0058be] rounded-2xl hover:bg-blue-50 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
               >
                <CircleEllipsis size={18} />
                Analizar Síntomas
               </button>
               <button 
                  onClick={subscribeToPush}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all shadow-sm text-[10px] font-black uppercase tracking-widest border ${
                    notifConfig.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white border-blue-100 text-[#0058be] hover:bg-blue-50'
                  }`}
                >
                  <Bell size={18} className={notifConfig.active ? 'animate-bounce' : ''} />
                  {notifConfig.active ? 'Recordatorios Activos' : 'Activar Recordatorios'}
                </button>
               <button 
                onClick={exportPDF}
                className="w-full flex items-center gap-3 px-6 py-4 bg-[#0058be] text-white rounded-2xl hover:bg-[#0047a0] transition-all shadow-lg shadow-blue-100 text-[10px] font-black uppercase tracking-widest"
               >
                <FileDown size={18} />
                Generar PDF Médico
               </button>
            </section>
          )}
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 text-slate-400 hover:text-[#0058be] border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-center bg-white"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col gap-6 relative overflow-hidden bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/40">
        <header className="px-12 py-12 flex items-center justify-between gap-6 relative z-10 bg-white">
          <div className="w-48 invisible" aria-hidden="true" />
          
          <div className="flex items-center gap-6">
            <button 
              onClick={prevMonth} 
              className="p-3 bg-white border border-slate-100 rounded-2xl text-[#0058be] hover:bg-blue-50 transition-all shadow-sm active:scale-90"
              title="Mes Anterior"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </button>
            
            <div className="flex items-center px-4 gap-2">
              <select 
                value={currentMonth.getMonth()} 
                onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
                className="bg-transparent text-sm font-black text-[#0058be] border-none focus:ring-0 uppercase tracking-widest cursor-pointer"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2026, i, 1), 'MMMM', { locale: es })}
                  </option>
                ))}
              </select>
              <span className="text-slate-300 font-black">/</span>
              <span className="text-sm font-black text-slate-500">{currentMonth.getFullYear()}</span>
            </div>

            <button 
              onClick={nextMonth} 
              className="p-3 bg-white border border-slate-100 rounded-2xl text-[#0058be] hover:bg-blue-50 transition-all shadow-sm active:scale-90"
              title="Mes Siguiente"
            >
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>
          
          <button 
            onClick={() => setCurrentMonth(new Date())} 
            className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-[#0058be] hover:bg-[#0058be] hover:text-white transition-all uppercase tracking-widest shadow-sm active:scale-95"
          >
            Hoy
          </button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col px-12 pb-12">
          <div className="grid grid-cols-7 text-center pb-10 font-bold text-slate-400 uppercase text-[12px] tracking-[0.2em] px-4">
            {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar pr-2">
            <CalendarGrid 
              currentMonth={currentMonth} 
              symptoms={symptoms} 
              period={period} 
              onDayClick={(date) => handleDayClick(date)} 
              selection={selection} 
              onSelectionStart={onSelectionStart} 
              onSelectionEnter={onSelectionEnter} 
              onSelectionEnd={onSelectionEnd}
            />
          </div>
        </div>
      </main>

      <div id="pdf-export-container" style={{ display: 'none' }}>
        <YearlyPDFViewer year={currentMonth.getFullYear()} symptoms={symptoms} period={period} />
      </div>
    </div>
  );
}
