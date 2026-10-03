import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useAppStore } from '../store/useAppStore';

export function CalendarView() {
  const { tasks, openTask, searchQuery } = useAppStore();
  const now = new Date();
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(now)),
    end: endOfWeek(endOfMonth(now)),
  });

  const listTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    if (!searchQuery.trim()) return true;
    return t.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      <div style={{ marginBottom: 12, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        {format(now, 'MMMM yyyy')}
      </div>
      <div className="calendar-grid" style={{ marginBottom: 8 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              padding: '0 8px',
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = listTasks.filter(
            (t) => t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === key,
          );
          return (
            <div
              key={key}
              className="cal-day"
              style={{ opacity: isSameMonth(day, now) ? 1 : 0.45 }}
            >
              <div className="cal-day-num">{format(day, 'd')}</div>
              {dayTasks.map((t) => (
                <button key={t.id} className="cal-task" onClick={() => openTask(t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
