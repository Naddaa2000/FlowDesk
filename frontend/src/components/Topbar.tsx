import { useEffect, useState } from 'react';
import { Mail, Plus, Search, UserPlus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { canManageGroups } from '../utils/permissions';
import { formatDistanceToNow } from 'date-fns';

type EmailRow = {
  id: string;
  to: string;
  subject: string;
  mode: string;
  previewUrl: string | null;
  at: string;
  error?: string;
};

export function Topbar() {
  const {
    searchQuery,
    setSearchQuery,
    setShowCreateModal,
    selectedProjectId,
    loadTasks,
    currentUser,
    projects,
  } = useAppStore();

  const [emailOpen, setEmailOpen] = useState(false);
  const [emails, setEmails] = useState<EmailRow[]>([]);

  const project = projects.find((p) => p.id === selectedProjectId);
  const canInvite = canManageGroups(currentUser, project);

  useEffect(() => {
    if (!selectedProjectId) return;
    const t = setTimeout(() => {
      loadTasks(selectedProjectId);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedProjectId, loadTasks]);

  const loadEmails = async () => {
    try {
      const rows = await api.getRecentEmails();
      setEmails(rows);
      setEmailOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} color="#8a9e97" />
        <input
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="topbar-actions">
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            onClick={() => (emailOpen ? setEmailOpen(false) : loadEmails())}
            title="Email log / previews"
          >
            <Mail size={15} /> Emails
          </button>
          {emailOpen && (
            <div className="notif-panel" style={{ right: 0, width: 400 }}>
              <div className="notif-header">
                Outbound emails
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px' }}
                  onClick={loadEmails}
                >
                  Refresh
                </button>
              </div>
              <div className="notif-list">
                {emails.length === 0 && (
                  <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    No emails yet. Assign a task or @mention someone, then refresh.
                    <br />
                    <br />
                    Without SMTP, emails use Ethereal — open the Preview link here (they
                    won&apos;t arrive in a real inbox).
                  </div>
                )}
                {emails.map((e) => (
                  <div key={e.id + e.at} className="notif-item">
                    <strong>{e.subject}</strong>
                    <span>To: {e.to}</span>
                    <small>
                      {formatDistanceToNow(new Date(e.at), { addSuffix: true })} · {e.mode}
                      {e.error ? ` · ${e.error}` : ''}
                    </small>
                    {e.previewUrl && (
                      <a
                        href={e.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="email-hint"
                        style={{ marginTop: 6 }}
                      >
                        Open email preview →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {canInvite && (
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setShowCreateModal('member')}
            >
              <Plus size={15} /> Add member
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setShowCreateModal('invite')}
            >
              <UserPlus size={15} /> Invite
            </button>
          </>
        )}
        {selectedProjectId && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal('task')}>
            <Plus size={15} /> Task
          </button>
        )}
      </div>
    </header>
  );
}
