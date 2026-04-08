import React from 'react';
import { format, startOfYear, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarGrid from './CalendarGrid';

export default function YearlyPDFViewer({ year, symptoms, period }) {
  const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfYear(new Date(year, 0, 1)), i));

  return (
    <div className="bg-slate-50 p-10 space-y-20 w-[1200px]" id="yearly-pdf-container">
      {/* Page 1: Jan - Jun */}
      <div id="pdf-page-1" className="bg-white p-10 rounded-[60px] shadow-2xl space-y-10 min-h-[1600px]">
        <h1 className="text-6xl font-black text-center text-slate-800 mb-10">Allergy HealthLog {year} - Semestre 1</h1>
        <div className="grid grid-cols-2 gap-10">
          {months.slice(0, 6).map(month => (
            <div key={month.toString()} className="space-y-4">
              <h2 className="text-3xl font-black capitalize text-[#0058be] px-4">{format(month, 'MMMM', { locale: es })}</h2>
              <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm h-[400px]">
                <CalendarGrid 
                  currentMonth={month}
                  symptoms={symptoms}
                  period={period}
                  onDayClick={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page 2: Jul - Dec */}
      <div id="pdf-page-2" className="bg-white p-10 rounded-[60px] shadow-2xl space-y-10 min-h-[1600px]">
        <h1 className="text-6xl font-black text-center text-slate-800 mb-10">Allergy HealthLog {year} - Semestre 2</h1>
        <div className="grid grid-cols-2 gap-10">
          {months.slice(6, 12).map(month => (
            <div key={month.toString()} className="space-y-4">
              <h2 className="text-3xl font-black capitalize text-[#0058be] px-4">{format(month, 'MMMM', { locale: es })}</h2>
              <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm h-[400px]">
                <CalendarGrid 
                  currentMonth={month}
                  symptoms={symptoms}
                  period={period}
                  onDayClick={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
