import { format, parseISO, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symptoms, currentMonth } = req.body;

  if (!symptoms || !currentMonth) {
    return res.status(400).json({ error: 'Faltan datos de síntomas o el mes' });
  }

  const monthDate = new Date(currentMonth);
  const monthName = format(monthDate, 'MMMM yyyy', { locale: es });
  const dayEntries = Object.entries(symptoms)
    .filter(([dateStr]) => isSameMonth(parseISO(dateStr), monthDate))
    .sort(([a], [b]) => a.localeCompare(b));

  if (dayEntries.length === 0) {
    return res.status(200).json({ reportText: `Sin registros para ${monthName}.` });
  }

  let reportText = `REPORTE DE SÍNTOMAS - ${monthName.toUpperCase()}\n`;
  reportText += `----------------------------------------\n\n`;

  dayEntries.forEach(([dateStr, daySymptoms]) => {
    if (daySymptoms.length > 0) {
      const date = format(parseISO(dateStr), 'dd MMM (EEEE)', { locale: es });
      reportText += `- ${date}: ${daySymptoms.map(s => s.replace('_', ' ').toUpperCase()).join(', ')}\n`;
    }
  });

  return res.status(200).json({ reportText });
}
