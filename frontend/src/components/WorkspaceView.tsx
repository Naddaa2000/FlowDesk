import {
  CalendarDays,
  Columns3,
  List,
  Plus,
  Settings2,
  UserPlus,
} from 'lucide-react';
import { useAppStore, type ViewType } from '../store/useAppStore';
import { ListView } from './ListView';
import { BoardView } from './BoardView';
import { CalendarView } from './CalendarView';
import { Avatar } from './Avatar';
import { canManageGroups } from '../utils/permissions';
import clsx from 'clsx';

const TABS: { type: ViewType; label: string; icon: typeof List }[] = [
  { type: 'list', label: 'List', icon: List },
  { type: 'board', label: 'Board', icon: Columns3 },
  { type: 'calendar', label: 'Calendar', icon: CalendarDays },
];

export function WorkspaceView() {
  const {
    projects,
    selectedProjectId,
    activeViewType,
    setActiveViewType,
    setShowCreateModal,
    setShowStatusManager,
    currentUser,
  } = useAppStore();

  const project = projects.find((p) => p.id === selectedProjectId);
  const members = project?.members?.map((m) => m.user) ?? [];
  const canManage = canManageGroups(currentUser, project);
  const isLead = canManage;

  if (!project) {
    return (
      <div className="view-body">
        <p style={{ color: 'var(--text-muted)' }}>
          Select or create a project to get started.
        </p>
      </div>
    );
  }

  const lead = project.lead || members.find((m) => m.id === project.leadId);

  return (
    <div className="content">
      <div className="view-header">
        <div className="view-title-row">
          <span
            className="space-swatch"
            style={{ width: 12, height: 12, background: project.color }}
          />
          <h1>{project.name}</h1>
          {lead && (
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Lead: {lead.name}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {canManage && (
              <button
                className="btn btn-ghost"
                onClick={() => setShowStatusManager(true)}
              >
                <Settings2 size={14} /> Statuses
              </button>
            )}
            {isLead && (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal('member')}
                >
                  <Plus size={14} /> Add member
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal('invite')}
                >
                  <UserPlus size={14} /> Invite
                </button>
              </>
            )}
          </div>
        </div>

        <div className="members-strip">
          {(project.members || []).map((m) => (
            <div key={m.id} className="member-card">
              <Avatar user={m.user} />
              <div>
                <div>{m.user.name}</div>
                <div className="role">{m.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="view-tabs">
          {TABS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              className={clsx('view-tab', activeViewType === type && 'active')}
              onClick={() => setActiveViewType(type)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="view-body">
        {activeViewType === 'list' && <ListView />}
        {activeViewType === 'board' && <BoardView />}
        {activeViewType === 'calendar' && <CalendarView />}
      </div>
    </div>
  );
}
