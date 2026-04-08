export const SYMPTOMS_KEY = 'alergia_data';

export const loadSymptoms = () => {
  const data = localStorage.getItem(SYMPTOMS_KEY);
  if (!data) return {};
  const parsed = JSON.parse(data);
  
  const normalized = {};
  Object.entries(parsed).forEach(([date, dayData]) => {
    if (Array.isArray(dayData)) {
      normalized[date] = {
        logs: dayData.map(s => typeof s === 'string' ? { id: s, intensity: 'moderate' } : s),
        comment: "",
        tags: []
      };
    } else {
      normalized[date] = {
        logs: dayData.logs || [],
        comment: dayData.comment || "",
        tags: dayData.tags || []
      };
    }
  });
  return normalized;
};

export const PERIOD_KEY = 'alergia_period';

export const loadPeriod = () => {
  const data = localStorage.getItem(PERIOD_KEY);
  return data ? JSON.parse(data) : { start: null, end: null };
};

export const saveSymptoms = (symptoms) => {
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(symptoms));
};

export const savePeriod = (period) => {
  localStorage.setItem(PERIOD_KEY, JSON.stringify(period));
};
