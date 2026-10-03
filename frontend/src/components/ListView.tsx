import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AvatarStack } from './Avatar';
import { DueDate, PriorityChip, StatusPill } from './TaskBits';

export function ListView() {
  const {
    selectedProjectId,
    projects,
    tasks,
    users,
    searchQuery,
    openTask,
    moveTaskStatus,
  } = useAppStore();

  const project = projects.find((p) => p.id === selectedProjectId);
  const statusMap = Object.fromEntries(
    (project?.statuses ?? []).map((s) => [s.id, s]),
  );

  const memberUsers = useMemo(() => {
    if (project?.members?.length) {
      return project.members.map((m) => m.user);
    }
    return users.filter((u) => project?.memberIds?.includes(u.id));
  }, [project, users]);

  const rows = useMemo(() => {
    let filtered = [...tasks];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => a.orderindex - b.orderindex);
  }, [tasks, searchQuery]);

  return (
    <table className="task-table">
      <thead>
        <tr>
          <th style={{ width: '40%' }}>Task</th>
          <th>Status</th>
          <th>Assignees</th>
          <th>Priority</th>
          <th>Due</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr className="empty-row">
            <td colSpan={6}>No tasks yet — create one to get started</td>
          </tr>
        )}
        {rows.map((task) => {
          const assignees = memberUsers.filter((u) =>
            (task.assigneeIds || []).includes(u.id),
          );
          const status = statusMap[task.statusId];
          return (
            <tr key={task.id}>
              <td>
                <div className="task-name-cell" onClick={() => openTask(task.id)}>
                  {task.name}
                </div>
              </td>
              <td>
                <StatusPill
                  status={status}
                  statuses={project?.statuses}
                  onChange={(id) => moveTaskStatus(task.id, id)}
                />
              </td>
              <td>
                <AvatarStack users={assignees} />
              </td>
              <td>
                <PriorityChip priority={task.priority} />
              </td>
              <td>
                <DueDate date={task.dueDate} />
              </td>
              <td>
                {task.tags?.map((name) => (
                  <span key={name} className="tag" style={{ background: '#64748b' }}>
                    {name}
                  </span>
                ))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
