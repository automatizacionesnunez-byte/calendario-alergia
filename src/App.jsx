import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, isSameMonth, parseISO, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
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
    <div className="flex flex-col md:flex-row bg-[#f8fafc] h-screen text-slate-800 font-outfit overflow-hidden p-1 md:p-2 gap-1 md:gap-2 relative">
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
      
      {/* Dynamic Sidebar */}
      <aside className={`fixed md:relative bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col gap-4 transition-all duration-500 shadow-xl z-50 ${sidebarOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full md:translate-x-0 md:w-16 overflow-hidden'} top-1 bottom-1 left-1 md:top-auto md:bottom-auto md:left-auto md:h-full`}>
        <div className="flex items-center gap-3 px-1">
           <div className="relative">
              <div className="p-2 bg-gradient-to-br from-[#0058be] to-[#0047a0] rounded-xl shadow-lg">
                 <CalendarIcon className="text-white w-5 h-5 shrink-0" />
              </div>
           </div>
           {sidebarOpen && (
             <div className="flex flex-col animate-fade-in">
                <h1 className="text-base font-black tracking-tight leading-none text-[#0058be]">HealthLog</h1>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Clínico</span>
             </div>
           )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1 no-scrollbar">
          {sidebarOpen && (
            <section className="space-y-3 animate-fade-in">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 group shadow-sm">
                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Actividad</h3>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-black text-[#0058be]">
                    {Object.values(symptoms).filter(day => (day.logs?.length > 0) || day.comment || (day.tags?.length > 0)).length}
                  </p>
                  <span className="text-slate-400 font-bold text-[10px]">Días</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl group shadow-sm">
                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Capa Crítica</h3>
                <div className="space-y-0.5">
                   <p className="text-[10px] font-bold text-emerald-500 truncate">
                     {period.start ? format(parseISO(period.start), 'dd/MM/yy', { locale: es }) : 'No ini'}
                   </p>
                   <p className="text-[10px] font-bold text-rose-500 truncate">
                     {period.end ? format(parseISO(period.end), 'dd/MM/yy', { locale: es }) : 'No fin'}
                   </p>
                </div>
              </div>
            </section>
          )}

          <section>
            {sidebarOpen && <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Herramientas</p>}
            <div className="space-y-1">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(prev => prev === tool.id ? null : tool.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${
                    selectedTool === tool.id 
                    ? 'bg-gradient-to-r from-[#0058be] to-[#0047a0] text-white shadow-lg' 
                    : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <tool.icon size={16} className={`shrink-0 ${selectedTool === tool.id ? 'text-white' : 'text-slate-400'}`} />
                  {sidebarOpen && <span className="font-bold text-[10px] truncate uppercase">{tool.label}</span>}
                </button>
              ))}
            </div>
          </section>

          {sidebarOpen && (
            <section className="animate-fade-in pt-3 border-t border-slate-100 flex flex-col gap-2">
               <button 
                onClick={() => setShowReport(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-blue-100 text-[#0058be] rounded-xl hover:bg-blue-50 text-[9px] font-black uppercase"
               >
                <CircleEllipsis size={14} />
                Analizar
               </button>
               <button 
                  onClick={subscribeToPush}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-[9px] font-black uppercase ${
                    notifConfig.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white border-blue-100 text-[#0058be]'
                  }`}
                >
                  <Bell size={14} />
                  Recordatorios
                </button>
               <button 
                onClick={exportPDF}
                className="w-full flex items-center justify-center gap-2 p-3 bg-[#0058be] text-white rounded-xl hover:bg-[#0047a0] text-[9px] font-black uppercase shadow-md shadow-blue-100"
               >
                <FileDown size={14} />
                Exportar
               </button>
            </section>
          )}
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 text-slate-400 hover:text-[#0058be] border border-slate-100 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center bg-white"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 flex flex-col gap-1 md:gap-2 relative overflow-hidden bg-white border border-slate-100 rounded-2xl md:rounded-3xl shadow-lg">
        <header className="px-4 py-2 md:px-6 md:py-3 flex items-center justify-between gap-2 bg-white relative z-10 border-b border-slate-50">
           <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={prevMonth} 
              className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[#0058be] hover:bg-blue-50"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            
            <div className="flex items-center gap-1 md:gap-2">
              <select 
                value={currentMonth.getMonth()} 
                onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
                className="bg-transparent text-[11px] md:text-sm font-black text-[#0058be] border-none focus:ring-0 uppercase tracking-widest cursor-pointer"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2026, i, 1), 'MMMM', { locale: es })}
                  </option>
                ))}
              </select>
              <span className="text-slate-300 font-black">/</span>
              <span className="text-[11px] md:text-sm font-black text-slate-400">{currentMonth.getFullYear()}</span>
            </div>

            <button 
              onClick={nextMonth} 
              className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[#0058be] hover:bg-blue-50"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
          
          <button 
            onClick={() => setCurrentMonth(new Date())} 
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-[#0058be] hover:bg-blue-50 uppercase tracking-widest shadow-sm"
          >
            Hoy
          </button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col px-4 md:px-6 pb-2 md:pb-4">
          <div className="grid grid-cols-7 text-center pb-2 font-bold text-slate-300 uppercase text-[8px] md:text-[9px] tracking-[0.2em]">
            {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
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
