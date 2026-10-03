import { format, isBefore, startOfDay } from 'date-fns';
import type { ApiStatus } from '../api/client';
import type { Priority } from '../store/useAppStore';
import clsx from 'clsx';

export function StatusPill({
  status,
  onChange,
  statuses,
}: {
  status?: ApiStatus;
  statuses?: ApiStatus[];
  onChange?: (id: string) => void;
}) {
  if (!status) return <span className="status-pill">—</span>;
  if (onChange && statuses) {
    return (
      <select
        className="status-pill"
        value={status.id}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{ borderLeft: `3px solid ${status.color}` }}
      >
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    );
  }
  return (
    <span className="status-pill">
      <span className="status-dot" style={{ background: status.color }} />
      {status.name}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  if (!priority) return null;
  return (
    <span className={clsx('priority-chip', `priority-${priority}`)}>{priority}</span>
  );
}

export function DueDate({ date }: { date: string | null }) {
  if (!date) return <span className="due-date">—</span>;
  const overdue = isBefore(new Date(date), startOfDay(new Date()));
  return (
    <span className={clsx('due-date', overdue && 'overdue')}>
      {format(new Date(date), 'MMM d')}
    </span>
  );
}
