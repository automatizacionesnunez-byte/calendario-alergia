import React from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isToday,
  isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import DayCell from './DayCell';

export default function CalendarGrid({ 
  currentMonth, symptoms = {}, period = { start: null, end: null }, onDayClick,
  selection = { start: null, end: null, isSelecting: false }, 
  onSelectionStart, onSelectionEnter, onSelectionEnd 
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const isSelected = (dateStr) => {
    if (!selection.start || !selection.end) return false;
    const start = selection.start < selection.end ? selection.start : selection.end;
    const end = selection.start < selection.end ? selection.end : selection.start;
    return dateStr >= start && dateStr <= end;
  };

  return (
    <div 
      className="grid grid-cols-7 gap-6 auto-rows-fr"
      onMouseLeave={onSelectionEnd}
    >
      {calendarDays.map((day, idx) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayData = symptoms[dateStr] || { logs: [], comment: "", tags: [] };
        const isStart = period.start === dateStr;
        const isEnd = period.end === dateStr;
        
        return (
          <DayCell 
            key={dateStr}
            day={day}
            isCurrentMonth={isSameMonth(day, monthStart)}
            isToday={isToday(day)}
            dayData={dayData}
            allSymptoms={symptoms}
            isStart={isStart}
            isEnd={isEnd}
            isSelected={isSelected(dateStr)}
            onClick={onDayClick}
            onMouseDown={() => onSelectionStart(dateStr)}
            onMouseEnter={() => onSelectionEnter(dateStr)}
            onMouseUp={onSelectionEnd}
          />
        );
      })}
    </div>
  );
}
