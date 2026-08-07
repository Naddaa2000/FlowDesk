import { LayoutList, LogOut, Plus, FolderKanban } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Avatar } from './Avatar';
import clsx from 'clsx';

export function Sidebar() {
  const {
    currentUser,
    projects,
    selectedProjectId,
    selectProject,
    setShowCreateModal,
    logout,
  } = useAppStore();

  const canCreate = Boolean(currentUser);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <LayoutList size={16} color="#fff" />
        </div>
        FlowDesk
      </div>

      <div className="workspace-chip">
        <span className="workspace-dot" />
        {currentUser?.role === 'admin' ? 'Admin workspace' : 'My projects'}
      </div>

      <div className="sidebar-scroll">
        <div className="sidebar-section">
          <div className="sidebar-label">
            Projects
            {canCreate && (
              <button
                className="icon-btn"
                title="New project"
                onClick={() => setShowCreateModal('project')}
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {projects.length === 0 && (
            <p style={{ padding: '8px', fontSize: 12, opacity: 0.5 }}>
              No projects yet
            </p>
          )}

          {projects.map((project) => (
            <button
              key={project.id}
              className={clsx('list-row', selectedProjectId === project.id && 'active')}
              onClick={() => selectProject(project.id)}
              style={{ marginBottom: 2 }}
            >
              <span className="space-swatch" style={{ background: project.color }} />
              <FolderKanban size={13} />
              <span style={{ flex: 1, textAlign: 'left' }}>{project.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        {currentUser && (
          <div className="user-pill">
            <Avatar user={currentUser} size="lg" />
            <div className="meta" style={{ flex: 1 }}>
              {currentUser.name}
              <span>
                {currentUser.email} · {currentUser.role}
              </span>
            </div>
            <button className="icon-btn" title="Logout" onClick={() => logout()}>
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
