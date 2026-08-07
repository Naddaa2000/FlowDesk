import { useMemo, useRef, useState, type DragEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AvatarStack } from './Avatar';
import { PriorityChip } from './TaskBits';
import { canManageGroups } from '../utils/permissions';
import clsx from 'clsx';

export function BoardView() {
  const {
    selectedProjectId,
    projects,
    tasks,
    users,
    searchQuery,
    currentUser,
    openTask,
    moveTaskStatus,
    setShowCreateModal,
    setShowStatusManager,
    updateStatus,
    deleteStatus,
  } = useAppStore();

  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const didDrag = useRef(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  const canManage = canManageGroups(currentUser, project);

  const memberUsers = useMemo(() => {
    if (project?.members?.length) return project.members.map((m) => m.user);
    return users.filter((u) => project?.memberIds?.includes(u.id));
  }, [project, users]);

  const columns = useMemo(() => {
    const statuses = [...(project?.statuses ?? [])].sort(
      (a, b) => a.orderindex - b.orderindex,
    );
    let filtered = [...tasks];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
    }
    return statuses.map((status) => ({
      status,
      tasks: filtered.filter((t) => String(t.statusId) === String(status.id)),
    }));
  }, [project, tasks, searchQuery]);

  const onDragStart = (e: DragEvent, taskId: string) => {
    didDrag.current = false;
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    requestAnimationFrame(() => {
      didDrag.current = true;
    });
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverStatus(null);
  };

  const onDragOver = (e: DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(statusId);
  };

  const onDrop = async (e: DragEvent, statusId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverStatus(null);
    setDraggingId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || String(task.statusId) === String(statusId)) return;

    try {
      await moveTaskStatus(taskId, statusId);
    } catch (err) {
      console.error('Failed to move task', err);
    }
  };

  const saveRename = async (statusId: string) => {
    const name = editName.trim();
    setEditingId(null);
    if (!name) return;
    try {
      await updateStatus(statusId, { name });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to rename group');
    }
  };

  const removeGroup = async (statusId: string, name: string) => {
    if ((project?.statuses.length || 0) <= 1) {
      alert('Cannot delete the last status group');
      return;
    }
    if (
      !confirm(
        `Delete group "${name}"? Tasks in it will move to another group.`,
      )
    ) {
      return;
    }
    try {
      await deleteStatus(statusId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete group');
    }
  };

  return (
    <div className="board">
      {columns.map(({ status, tasks: colTasks }) => (
        <div
          key={status.id}
          className={clsx(
            'board-col',
            dragOverStatus === status.id && 'board-col-drop',
          )}
          onDragOver={(e) => onDragOver(e, status.id)}
          onDragLeave={() => {
            setDragOverStatus((cur) => (cur === status.id ? null : cur));
          }}
          onDrop={(e) => onDrop(e, status.id)}
        >
          <div className="board-col-header">
            <span className="status-dot" style={{ background: status.color }} />
            {editingId === status.id ? (
              <input
                className="board-col-rename"
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => saveRename(status.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(status.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
            ) : (
              <span className="board-col-name">{status.name}</span>
            )}
            <span className="board-count">{colTasks.length}</span>
            {canManage && editingId !== status.id && (
              <div className="board-col-actions">
                <button
                  type="button"
                  className="board-col-btn"
                  title="Rename group"
                  onClick={() => {
                    setEditingId(status.id);
                    setEditName(status.name);
                  }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  className="board-col-btn danger"
                  title="Delete group"
                  onClick={() => removeGroup(status.id, status.name)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
          <div className="board-cards">
            {colTasks.map((task) => {
              const assignees = memberUsers.filter((u) =>
                (task.assigneeIds || []).includes(u.id),
              );
              return (
                <div
                  key={task.id}
                  className={clsx(
                    'task-card',
                    draggingId === task.id && 'task-card-dragging',
                  )}
                  draggable
                  onDragStart={(e) => onDragStart(e, task.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => {
                    if (didDrag.current) {
                      didDrag.current = false;
                      return;
                    }
                    openTask(task.id);
                  }}
                >
                  <h4>{task.name}</h4>
                  <div className="task-card-meta">
                    <PriorityChip priority={task.priority} />
                    <AvatarStack users={assignees} />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="board-add" onClick={() => setShowCreateModal('task')}>
            <Plus size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Add task
          </button>
        </div>
      ))}

      {canManage && (
        <button
          type="button"
          className="board-add-group"
          onClick={() => setShowStatusManager(true)}
        >
          <Plus size={16} /> Edit statuses
        </button>
      )}
    </div>
  );
}
