import { useState } from 'react';
import { useAppStore, type Priority } from '../store/useAppStore';

const COLORS = ['#0f766e', '#0369a1', '#b45309', '#be123c', '#6d28d9', '#15803d'];

export function CreateModal() {
  const {
    showCreateModal,
    setShowCreateModal,
    currentUser,
    users,
    projects,
    selectedProjectId,
    createProject,
    createTask,
    addStatus,
    addOrInviteMember,
  } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [priority, setPriority] = useState<Priority>('normal');
  const [assigneeId, setAssigneeId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [projectRole, setProjectRole] = useState<'lead' | 'developer' | 'qa'>(
    'developer',
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!showCreateModal) return null;

  const project = projects.find((p) => p.id === selectedProjectId);
  const members = project?.members?.map((m) => m.user) ?? [];
  const availableUsers = users.filter((u) => !members.some((m) => m.id === u.id));

  const titles = {
    project: 'Create project',
    task: 'Create task',
    status: 'Create status group',
    member: 'Add member',
    invite: 'Invite member',
  };

  const close = () => {
    setShowCreateModal(null);
    setName('');
    setDescription('');
    setEmail('');
    setError('');
    setLeadId('');
    setAssigneeId('');
    setProjectRole('developer');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      switch (showCreateModal) {
        case 'project':
          await createProject({
            name: name.trim(),
            color,
            leadId: currentUser?.role === 'admin' && leadId ? leadId : undefined,
          });
          break;
        case 'task':
          await createTask({
            name: name.trim(),
            description: description.trim(),
            priority,
            assignees: assigneeId ? [assigneeId] : [],
          });
          break;
        case 'status':
          await addStatus(name.trim(), color);
          break;
        case 'member':
          if (!assigneeId) throw new Error('Select a user to add');
          await addOrInviteMember({ userId: assigneeId, role: projectRole });
          break;
        case 'invite':
          if (!email.trim()) throw new Error('Email is required');
          if (!name.trim()) throw new Error('Name is required');
          await addOrInviteMember({
            email: email.trim(),
            name: name.trim(),
            role: projectRole,
          });
          break;
      }
      setName('');
      setDescription('');
      setEmail('');
      setAssigneeId('');
      setProjectRole('developer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const roleSelect = (
    <label>
      Role
      <select
        value={projectRole}
        onChange={(e) =>
          setProjectRole(e.target.value as 'lead' | 'developer' | 'qa')
        }
        required
      >
        <option value="developer">Developer</option>
        <option value="qa">QA</option>
        <option value="lead">Lead</option>
      </select>
    </label>
  );

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">{titles[showCreateModal]}</div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {showCreateModal === 'member' && (
              <>
                <label>
                  User
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    required
                    autoFocus
                  >
                    <option value="">Select existing user…</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </label>
                {roleSelect}
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Adds someone who already has a FlowDesk account to this project.
                </p>
              </>
            )}

            {showCreateModal === 'invite' && (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                  />
                </label>
                <label>
                  Name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                  />
                </label>
                {roleSelect}
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Sends an invite email (or preview in Emails if SMTP isn&apos;t set).
                  Creates an account if they&apos;re new.
                </p>
              </>
            )}

            {showCreateModal !== 'member' && showCreateModal !== 'invite' && (
              <>
                <label>
                  {showCreateModal === 'task' ? 'Title' : 'Name'}
                  <input
                    autoFocus
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      showCreateModal === 'task' ? 'Task title' : 'Name'
                    }
                  />
                </label>

                {showCreateModal === 'task' && (
                  <label>
                    Description
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What needs to be done?"
                      rows={4}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none',
                        resize: 'vertical',
                        fontWeight: 500,
                      }}
                    />
                  </label>
                )}

                {(showCreateModal === 'project' || showCreateModal === 'status') && (
                  <label>
                    Color
                    <div className="color-row">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`color-swatch ${color === c ? 'selected' : ''}`}
                          style={{ background: c }}
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                  </label>
                )}

                {showCreateModal === 'project' && currentUser?.role === 'admin' && (
                  <label>
                    Assign lead
                    <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                      <option value="">Me (default)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {showCreateModal === 'task' && (
                  <>
                    <label>
                      Priority
                      <select
                        value={priority ?? ''}
                        onChange={(e) =>
                          setPriority((e.target.value || null) as Priority)
                        }
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                    </label>
                    <label>
                      Assign to
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {members.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </>
            )}
            {error && <div className="auth-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy
                ? 'Saving…'
                : showCreateModal === 'invite'
                  ? 'Send invite'
                  : showCreateModal === 'member'
                    ? 'Add member'
                    : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
