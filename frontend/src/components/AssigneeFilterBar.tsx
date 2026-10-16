import { useMemo, useRef, useState } from 'react';
import { ChevronDown, User, UserX, Users } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { Avatar } from './Avatar';
import { isAssigneeFilterActive } from '../utils/taskFilters';

export function AssigneeFilterBar() {
  const {
    currentUser,
    projects,
    selectedProjectId,
    assigneeFilter,
    setAssigneeFilter,
  } = useAppStore();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const project = projects.find((p) => p.id === selectedProjectId);
  const members = useMemo(
    () => project?.members?.map((m) => m.user) ?? [],
    [project],
  );

  if (!selectedProjectId || !project) return null;

  const active = isAssigneeFilterActive(assigneeFilter);
  const mineActive =
    !assigneeFilter.unassignedOnly &&
    currentUser &&
    assigneeFilter.userIds.length === 1 &&
    assigneeFilter.userIds[0] === currentUser.id;
  const unassignedActive = assigneeFilter.unassignedOnly;
  const multiActive =
    !assigneeFilter.unassignedOnly && assigneeFilter.userIds.length > 0 && !mineActive;

  const toggleUser = (userId: string) => {
    const set = new Set(assigneeFilter.userIds);
    if (set.has(userId)) set.delete(userId);
    else set.add(userId);
    setAssigneeFilter({ userIds: [...set], unassignedOnly: false });
  };

  const label = unassignedActive
    ? 'Unassigned'
    : mineActive
      ? 'My tasks'
      : multiActive
        ? `${assigneeFilter.userIds.length} people`
        : 'All assignees';

  return (
    <div className="assignee-filter" ref={wrapRef}>
      <button
        type="button"
        className={clsx('assignee-filter-trigger', active && 'active')}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Users size={15} />
        <span className="assignee-filter-label">{label}</span>
        <ChevronDown size={14} className={clsx('assignee-filter-chevron', open && 'open')} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="assignee-filter-backdrop"
            aria-label="Close assignee filter"
            onClick={() => setOpen(false)}
          />
          <div className="assignee-filter-panel">
            <div className="assignee-filter-presets">
              <button
                type="button"
                className={clsx(!active && 'active')}
                onClick={() => {
                  setAssigneeFilter({ userIds: [], unassignedOnly: false });
                  setOpen(false);
                }}
              >
                All
              </button>
              {currentUser && (
                <button
                  type="button"
                  className={clsx(mineActive && 'active')}
                  onClick={() => {
                    setAssigneeFilter({
                      userIds: [currentUser.id],
                      unassignedOnly: false,
                    });
                    setOpen(false);
                  }}
                >
                  <User size={13} /> My tasks
                </button>
              )}
              <button
                type="button"
                className={clsx(unassignedActive && 'active')}
                onClick={() => {
                  setAssigneeFilter({ userIds: [], unassignedOnly: true });
                  setOpen(false);
                }}
              >
                <UserX size={13} /> Unassigned
              </button>
            </div>

            <p className="assignee-filter-hint">
              Select one or more people — tasks assigned to any of them are shown.
            </p>

            <ul className="assignee-filter-list">
              {members.map((u) => {
                const checked =
                  !assigneeFilter.unassignedOnly &&
                  assigneeFilter.userIds.includes(u.id);
                return (
                  <li key={u.id}>
                    <label className="assignee-filter-row">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUser(u.id)}
                      />
                      <Avatar user={u} />
                      <span className="assignee-filter-name">
                        {u.name}
                        {currentUser?.id === u.id && (
                          <small> (you)</small>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {multiActive && (
              <button
                type="button"
                className="btn btn-ghost assignee-filter-apply"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
