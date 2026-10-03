import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  Flag,
  GitBranch,
  Hourglass,
  ListTodo,
  Paperclip,
  Play,
  Square,
  Tag,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { Avatar } from './Avatar';
import { fileUrl, type ApiChecklist } from '../api/client';
import { RichTextEditor } from './RichTextEditor';
import {
  MentionCommentInput,
  renderCommentText,
} from './MentionCommentInput';
import clsx from 'clsx';

function formatMs(ms: number | null | undefined) {
  if (!ms) return 'Empty';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function estimateToMs(value: string): number | null {
  if (!value.trim()) return null;
  const hours = Number(value);
  if (Number.isNaN(hours) || hours < 0) return null;
  return Math.round(hours * 3600000);
}

export function TaskDrawer() {
  const {
    selectedTaskId,
    openTask,
    tasks,
    projects,
    selectedProjectId,
    comments,
    attachments,
    activity,
    subtasks,
    updateTask,
    assignTask,
    moveTaskStatus,
    deleteTask,
    addComment,
    uploadAttachment,
    createSubtask,
    startTimer,
    stopTimer,
  } = useAppStore();

  const [tagInput, setTagInput] = useState('');
  const [subtaskName, setSubtaskName] = useState('');
  const [checklistName, setChecklistName] = useState('');
  const [checklistItem, setChecklistItem] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const task = tasks.find((t) => t.id === selectedTaskId);
  const project = projects.find((p) => p.id === selectedProjectId);

  const closedStatus = useMemo(
    () => project?.statuses.find((s) => s.type === 'closed') || project?.statuses.at(-1),
    [project],
  );

  if (!task || !selectedTaskId || !project) return null;

  const members = project.members?.map((m) => m.user) ?? [];
  const checklists: ApiChecklist[] = task.checklists || [];
  const timerRunning = Boolean(task.timerStartedAt);

  const patchChecklists = (next: ApiChecklist[]) =>
    updateTask(task.id, {
      checklists: next.map((cl) => ({
        ...(cl.id.startsWith('tmp_') ? {} : { _id: cl.id }),
        name: cl.name,
        items: cl.items.map((item) => ({
          ...(item.id.startsWith('tmp_') ? {} : { _id: item.id }),
          name: item.name,
          resolved: item.resolved,
          assignee: item.assigneeId,
        })),
      })),
    });

  const completeTask = () => {
    if (closedStatus) moveTaskStatus(task.id, closedStatus.id);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={() => openTask(null)} />
      <aside className="drawer drawer-wide">
        <div className="cu-task-top">
          <div className="cu-breadcrumb">
            <span>{project.name}</span>
            <span className="cu-sep">/</span>
            <span>Task</span>
            {task.createdAt && (
              <span className="cu-created">
                Created {new Date(task.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="cu-top-actions">
            <button
              className="btn-icon"
              onClick={() => deleteTask(task.id)}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <button className="btn-icon" onClick={() => openTask(null)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cu-task-layout">
          <div className="cu-task-main">
            <input
              className="cu-title"
              placeholder="Task title"
              value={task.name}
              onChange={(e) => updateTask(task.id, { name: e.target.value })}
            />

            <div className="cu-props">
              <div className="cu-prop">
                <span className="cu-prop-label">
                  <CheckCircle2 size={14} /> Status
                </span>
                <div className="cu-prop-value cu-status-row">
                  <select
                    value={task.statusId}
                    onChange={(e) => moveTaskStatus(task.id, e.target.value)}
                  >
                    {project.statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-ghost cu-complete"
                    type="button"
                    onClick={completeTask}
                    title="Mark complete"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              </div>

              <div className="cu-prop">
                <span className="cu-prop-label">Assignees</span>
                <div className="cu-prop-value">
                  <div className="assignee-picker">
                    {members.map((u) => {
                      const selected = (task.assigneeIds || []).includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          className={clsx('assignee-chip', selected && 'selected')}
                          onClick={() => {
                            const next = selected
                              ? (task.assigneeIds || []).filter((id) => id !== u.id)
                              : [...(task.assigneeIds || []), u.id];
                            assignTask(task.id, next);
                          }}
                        >
                          <Avatar user={u} />
                          {u.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="cu-prop">
                <span className="cu-prop-label">Dates</span>
                <div className="cu-prop-value cu-dates">
                  <label>
                    Start
                    <input
                      type="date"
                      value={task.startDate ? String(task.startDate).slice(0, 10) : ''}
                      onChange={(e) =>
                        updateTask(task.id, {
                          startDate: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    Due
                    <input
                      type="date"
                      value={task.dueDate ? String(task.dueDate).slice(0, 10) : ''}
                      onChange={(e) =>
                        updateTask(task.id, {
                          dueDate: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="cu-prop">
                <span className="cu-prop-label">
                  <Flag size={14} /> Priority
                </span>
                <div className="cu-prop-value">
                  <select
                    value={task.priority ?? ''}
                    onChange={(e) =>
                      updateTask(task.id, { priority: e.target.value || null })
                    }
                  >
                    <option value="">Empty</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="cu-prop">
                <span className="cu-prop-label">
                  <Hourglass size={14} /> Time estimate
                </span>
                <div className="cu-prop-value">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="Hours"
                    value={
                      task.timeEstimate != null
                        ? String(task.timeEstimate / 3600000)
                        : ''
                    }
                    onChange={(e) =>
                      updateTask(task.id, {
                        timeEstimate: estimateToMs(e.target.value),
                      })
                    }
                  />
                  <span className="cu-hint">{formatMs(task.timeEstimate)}</span>
                </div>
              </div>

              <div className="cu-prop">
                <span className="cu-prop-label">
                  <Target size={14} /> Sprint points
                </span>
                <div className="cu-prop-value">
                  <input
                    type="number"
                    min={0}
                    placeholder="Empty"
                    value={task.points ?? ''}
                    onChange={(e) =>
                      updateTask(task.id, {
                        points: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="cu-prop">
                <span className="cu-prop-label">Track time</span>
                <div className="cu-prop-value cu-timer">
                  <span className="cu-hint">{formatMs(task.timeSpent)}</span>
                  {timerRunning ? (
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => stopTimer(task.id)}
                    >
                      <Square size={14} /> Stop
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => startTimer(task.id)}
                    >
                      <Play size={14} /> Start
                    </button>
                  )}
                </div>
              </div>

              <div className="cu-prop">
                <span className="cu-prop-label">
                  <Tag size={14} /> Tags
                </span>
                <div className="cu-prop-value">
                  <div className="cu-tags">
                    {(task.tags || []).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="tag"
                        style={{ background: '#0f766e' }}
                        onClick={() =>
                          updateTask(task.id, {
                            tags: (task.tags || []).filter((x) => x !== t),
                          })
                        }
                        title="Remove tag"
                      >
                        {t} ×
                      </button>
                    ))}
                  </div>
                  <form
                    className="cu-inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const next = tagInput.trim().toLowerCase();
                      if (!next) return;
                      if (!(task.tags || []).includes(next)) {
                        updateTask(task.id, { tags: [...(task.tags || []), next] });
                      }
                      setTagInput('');
                    }}
                  >
                    <input
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                    />
                  </form>
                </div>
              </div>
            </div>

            <div className="cu-section">
              <div className="section-title">Description</div>
              <RichTextEditor
                value={task.description || ''}
                placeholder="Add description…"
                onChange={(html) => {
                  if (html !== (task.description || '')) {
                    updateTask(task.id, { description: html });
                  }
                }}
              />
            </div>

            <div className="cu-actions-list">
              <button
                type="button"
                className="cu-action"
                onClick={() => setShowSubtaskInput(true)}
              >
                <ListTodo size={15} /> Add subtask
              </button>
              <button
                type="button"
                className="cu-action"
                onClick={() => setShowChecklistInput(true)}
              >
                <CheckSquare size={15} /> Create checklist
              </button>
              <button
                type="button"
                className="cu-action"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                <Paperclip size={15} /> Attach file
              </button>
              <button type="button" className="cu-action" disabled title="Coming soon">
                <GitBranch size={15} /> Relate / dependencies
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  await uploadAttachment(task.id, file);
                } finally {
                  setBusy(false);
                  e.target.value = '';
                }
              }}
            />

            {(showSubtaskInput || subtasks.length > 0) && (
              <div className="cu-section">
                <div className="section-title">Subtasks</div>
                <ul className="cu-subtasks">
                  {subtasks.map((s) => (
                    <li key={s.id}>
                      <span>{s.name}</span>
                    </li>
                  ))}
                </ul>
                {showSubtaskInput && (
                  <form
                    className="cu-inline-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!subtaskName.trim()) return;
                      await createSubtask(task.id, subtaskName.trim());
                      setSubtaskName('');
                      setShowSubtaskInput(false);
                    }}
                  >
                    <input
                      autoFocus
                      placeholder="Subtask name"
                      value={subtaskName}
                      onChange={(e) => setSubtaskName(e.target.value)}
                    />
                    <button className="btn btn-primary" type="submit">
                      Add
                    </button>
                  </form>
                )}
              </div>
            )}

            {(showChecklistInput || checklists.length > 0) && (
              <div className="cu-section">
                <div className="section-title">Checklists</div>
                {checklists.map((cl) => (
                  <div key={cl.id} className="checklist">
                    <div className="section-title">{cl.name}</div>
                    {cl.items.map((item) => (
                      <label
                        key={item.id}
                        className={clsx('checklist-item', item.resolved && 'done')}
                      >
                        <input
                          type="checkbox"
                          checked={item.resolved}
                          onChange={() => {
                            const next = checklists.map((c) =>
                              c.id !== cl.id
                                ? c
                                : {
                                    ...c,
                                    items: c.items.map((i) =>
                                      i.id === item.id
                                        ? { ...i, resolved: !i.resolved }
                                        : i,
                                    ),
                                  },
                            );
                            patchChecklists(next);
                          }}
                        />
                        {item.name}
                      </label>
                    ))}
                    <form
                      className="cu-inline-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!checklistItem.trim()) return;
                        const next = checklists.map((c) =>
                          c.id !== cl.id
                            ? c
                            : {
                                ...c,
                                items: [
                                  ...c.items,
                                  {
                                    id: `tmp_${Date.now()}`,
                                    name: checklistItem.trim(),
                                    resolved: false,
                                    assigneeId: null,
                                  },
                                ],
                              },
                        );
                        patchChecklists(next);
                        setChecklistItem('');
                      }}
                    >
                      <input
                        placeholder="Add checklist item"
                        value={checklistItem}
                        onChange={(e) => setChecklistItem(e.target.value)}
                      />
                    </form>
                  </div>
                ))}
                {showChecklistInput && (
                  <form
                    className="cu-inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!checklistName.trim()) return;
                      patchChecklists([
                        ...checklists,
                        {
                          id: `tmp_cl_${Date.now()}`,
                          name: checklistName.trim(),
                          items: [],
                        },
                      ]);
                      setChecklistName('');
                      setShowChecklistInput(false);
                    }}
                  >
                    <input
                      autoFocus
                      placeholder="Checklist name"
                      value={checklistName}
                      onChange={(e) => setChecklistName(e.target.value)}
                    />
                    <button className="btn btn-primary" type="submit">
                      Create
                    </button>
                  </form>
                )}
              </div>
            )}

            {attachments.length > 0 && (
              <div className="cu-section">
                <div className="section-title">Attachments</div>
                <ul className="cu-files">
                  {attachments.map((a) => (
                    <li key={a.id}>
                      <a href={fileUrl(a.url)} target="_blank" rel="noreferrer">
                        {a.originalName}
                      </a>
                      <span>{(a.size / 1024).toFixed(1)} KB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="cu-task-side">
            <div className="cu-side-header">Activity</div>
            <div className="cu-activity">
              {activity.length === 0 && (
                <p className="cu-empty">No activity yet</p>
              )}
              {activity.map((a) => (
                <div key={a.id} className="cu-activity-item">
                  <Avatar user={a.user} />
                  <div>
                    <strong>{a.user.name}</strong> {a.detail || a.action}
                    <small>
                      {formatDistanceToNow(new Date(a.createdAt), {
                        addSuffix: true,
                      })}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            <div className="cu-side-header">Comments</div>
            <div className="comment-list cu-comments">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <Avatar user={c.user} />
                  <div className="comment-body">
                    <div className="comment-meta">
                      {c.user.name} ·{' '}
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                    <div className="comment-text">{renderCommentText(c.text)}</div>
                  </div>
                </div>
              ))}
            </div>
            <MentionCommentInput
              members={members}
              onSubmit={async (text, mentionIds) => {
                await addComment(task.id, text, mentionIds);
              }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
