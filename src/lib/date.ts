// Date/time formatting with dayjs (Indian style: 18 Nov 2026, 4:10 PM).
import dayjs from 'dayjs';

export const time = (iso?: string | null) => (iso ? dayjs(iso).format('h:mm A') : '—');
export const date = (iso?: string | null) => {
  if (!iso) return '[DATE]';
  const d = dayjs(iso);
  return d.isValid() ? d.format('D MMM YYYY') : iso;
};
export const dayTime = (iso?: string | null) => (iso ? dayjs(iso).format('ddd, h:mm A') : '—');

/** "Today, 10:00 AM" / "Tomorrow, 6:30 AM" / "Fri, 10:00 AM" */
export const relativeDayTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = dayjs(iso);
  const today = dayjs().startOf('day');
  const diff = d.startOf('day').diff(today, 'day');
  const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.format('ddd');
  return `${label}, ${d.format('h:mm A')}`;
};
