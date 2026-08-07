import { create } from 'zustand';
import {
  api,
  setToken,
  type ApiActivity,
  type ApiAttachment,
  type ApiComment,
  type ApiProject,
  type ApiTask,
  type ApiUser,
} from '../api/client';

export type ViewType = 'list' | 'board' | 'calendar';
export type Priority = 'urgent' | 'high' | 'normal' | 'low' | null;

interface AppState {
  bootstrapped: boolean;
  loading: boolean;
  error: string | null;
  currentUser: ApiUser | null;
  users: ApiUser[];
  projects: ApiProject[];
  tasks: ApiTask[];
  comments: ApiComment[];
  attachments: ApiAttachment[];
  activity: ApiActivity[];
  subtasks: ApiTask[];
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  activeViewType: ViewType;
  searchQuery: string;
  showCreateModal: 'project' | 'task' | 'status' | 'member' | 'invite' | null;
  showStatusManager: boolean;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  loadProjects: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  loadTasks: (projectId: string) => Promise<void>;
  openTask: (id: string | null) => Promise<void>;
  refreshTaskExtras: (taskId: string) => Promise<void>;

  setActiveViewType: (t: ViewType) => void;
  setSearchQuery: (q: string) => void;
  setShowCreateModal: (m: AppState['showCreateModal']) => void;
  setShowStatusManager: (open: boolean) => void;
  clearError: () => void;

  createProject: (payload: {
    name: string;
    color: string;
    leadId?: string;
    description?: string;
  }) => Promise<void>;
  createTask: (payload: {
    name: string;
    description?: string;
    priority?: Priority;
    assignees?: string[];
  }) => Promise<void>;
  updateTask: (id: string, patch: Record<string, unknown>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (taskId: string, assigneeIds: string[]) => Promise<void>;
  moveTaskStatus: (taskId: string, statusId: string) => Promise<void>;
  addStatus: (
    name: string,
    color: string,
    type?: 'open' | 'custom' | 'closed',
  ) => Promise<void>;
  updateStatus: (
    statusId: string,
    patch: { name?: string; color?: string; type?: string },
  ) => Promise<void>;
  reorderStatuses: (orderedIds: string[]) => Promise<void>;
  deleteStatus: (statusId: string) => Promise<void>;
  addOrInviteMember: (payload: {
    email?: string;
    name?: string;
    userId?: string;
    role?: 'lead' | 'developer' | 'qa';
  }) => Promise<void>;
  addComment: (taskId: string, text: string, mentionIds?: string[]) => Promise<void>;
  uploadAttachment: (taskId: string, file: File) => Promise<void>;
  createSubtask: (taskId: string, name: string) => Promise<void>;
  startTimer: (taskId: string) => Promise<void>;
  stopTimer: (taskId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  bootstrapped: false,
  loading: false,
  error: null,
  currentUser: null,
  users: [],
  projects: [],
  tasks: [],
  comments: [],
  attachments: [],
  activity: [],
  subtasks: [],
  selectedProjectId: null,
  selectedTaskId: null,
  activeViewType: 'list',
  searchQuery: '',
  showCreateModal: null,
  showStatusManager: false,

  clearError: () => set({ error: null }),
  setActiveViewType: (t) => set({ activeViewType: t }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowCreateModal: (m) => set({ showCreateModal: m }),
  setShowStatusManager: (open) => set({ showStatusManager: open }),

  bootstrap: async () => {
    const token = localStorage.getItem('flowdesk_token');
    if (!token) {
      set({ bootstrapped: true, currentUser: null });
      return;
    }
    try {
      set({ loading: true });
      const { user } = await api.me();
      set({ currentUser: user });
      await get().loadProjects();
      const users = await api.getUsers().catch(() => []);
      set({ users, bootstrapped: true, loading: false });
    } catch {
      setToken(null);
      set({ currentUser: null, bootstrapped: true, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await api.login({ email, password });
      setToken(token);
      set({ currentUser: user });
      await get().loadProjects();
      const users = await api.getUsers().catch(() => []);
      set({ users, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await api.register({ name, email, password });
      setToken(token);
      set({ currentUser: user, loading: false });
      await get().loadProjects();
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Register failed',
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setToken(null);
    set({
      currentUser: null,
      projects: [],
      tasks: [],
      selectedProjectId: null,
      selectedTaskId: null,
    });
  },

  loadProjects: async () => {
    const projects = await api.getProjects();
    const selected =
      get().selectedProjectId &&
      projects.some((p) => p.id === get().selectedProjectId)
        ? get().selectedProjectId
        : projects[0]?.id ?? null;
    set({ projects, selectedProjectId: selected });
    if (selected) await get().loadTasks(selected);
  },

  selectProject: async (id) => {
    set({ selectedProjectId: id, selectedTaskId: null, comments: [], attachments: [] });
    const project = await api.getProject(id);
    set({
      projects: get().projects.map((p) => (p.id === id ? project : p)),
    });
    await get().loadTasks(id);
  },

  loadTasks: async (projectId) => {
    const q = get().searchQuery.trim() || undefined;
    const tasks = await api.getTasks(projectId, q);
    set({ tasks });
  },

  openTask: async (id) => {
    set({
      selectedTaskId: id,
      comments: [],
      attachments: [],
      activity: [],
      subtasks: [],
    });
    if (!id) return;
    const [comments, attachments, task, activity, subtasks] = await Promise.all([
      api.getComments(id),
      api.getAttachments(id),
      api.getTask(id),
      api.getActivity(id),
      api.getSubtasks(id),
    ]);
    set({
      comments,
      attachments,
      activity,
      subtasks,
      tasks: get().tasks.map((t) => (t.id === id ? task : t)),
    });
  },

  refreshTaskExtras: async (taskId) => {
    const [activity, subtasks, comments] = await Promise.all([
      api.getActivity(taskId),
      api.getSubtasks(taskId),
      api.getComments(taskId),
    ]);
    set({ activity, subtasks, comments });
  },

  createProject: async ({ name, color, leadId, description }) => {
    const project = await api.createProject({ name, color, leadId, description });
    set({
      projects: [project, ...get().projects],
      selectedProjectId: project.id,
      showCreateModal: null,
      tasks: [],
    });
    await get().loadTasks(project.id);
  },

  createTask: async ({ name, description, priority, assignees }) => {
    const projectId = get().selectedProjectId;
    if (!projectId) return;
    const task = await api.createTask(projectId, {
      name,
      description: description || '',
      priority,
      assignees: assignees || [],
    });
    set({
      tasks: [task, ...get().tasks],
      showCreateModal: null,
      selectedTaskId: task.id,
    });
    await get().openTask(task.id);
  },

  updateTask: async (id, patch) => {
    const task = await api.updateTask(id, patch);
    set({ tasks: get().tasks.map((t) => (t.id === id ? task : t)) });
    if (get().selectedTaskId === id) {
      const activity = await api.getActivity(id).catch(() => get().activity);
      set({ activity });
    }
  },

  deleteTask: async (id) => {
    await api.deleteTask(id);
    set({
      tasks: get().tasks.filter((t) => t.id !== id),
      selectedTaskId: get().selectedTaskId === id ? null : get().selectedTaskId,
    });
  },

  assignTask: async (taskId, assigneeIds) => {
    const task = await api.assignTask(taskId, assigneeIds);
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? task : t)) });
  },

  moveTaskStatus: async (taskId, statusId) => {
    // Optimistic UI so the card moves immediately
    const prev = get().tasks;
    set({
      tasks: prev.map((t) =>
        t.id === taskId ? { ...t, statusId, updatedAt: new Date().toISOString() } : t,
      ),
    });
    try {
      const task = await api.moveTask(taskId, { statusId });
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? task : t)) });
    } catch (err) {
      set({ tasks: prev });
      throw err;
    }
  },

  addStatus: async (name, color, type = 'custom') => {
    const projectId = get().selectedProjectId;
    if (!projectId) return;
    const status = await api.addStatus(projectId, { name, color, type });
    set({
      projects: get().projects.map((p) =>
        p.id === projectId ? { ...p, statuses: [...p.statuses, status] } : p,
      ),
      showCreateModal: null,
    });
  },

  updateStatus: async (statusId, patch) => {
    const projectId = get().selectedProjectId;
    if (!projectId) return;
    const status = await api.updateStatus(projectId, statusId, patch);
    set({
      projects: get().projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              statuses: p.statuses.map((s) => (s.id === statusId ? status : s)),
            }
          : p,
      ),
    });
  },

  reorderStatuses: async (orderedIds) => {
    const projectId = get().selectedProjectId;
    if (!projectId) return;
    const statuses = await api.reorderStatuses(projectId, orderedIds);
    set({
      projects: get().projects.map((p) =>
        p.id === projectId ? { ...p, statuses } : p,
      ),
    });
  },

  deleteStatus: async (statusId) => {
    const projectId = get().selectedProjectId;
    if (!projectId) return;
    const result = await api.deleteStatus(projectId, statusId);
    set({
      projects: get().projects.map((p) =>
        p.id === projectId
          ? { ...p, statuses: p.statuses.filter((s) => s.id !== statusId) }
          : p,
      ),
      tasks: get().tasks.map((t) =>
        String(t.statusId) === String(statusId)
          ? { ...t, statusId: result.movedToStatusId }
          : t,
      ),
    });
  },

  addOrInviteMember: async (payload) => {
    const projectId = get().selectedProjectId;
    if (!projectId) return;
    await api.addMember(projectId, payload);
    const project = await api.getProject(projectId);
    set({
      projects: get().projects.map((p) => (p.id === projectId ? project : p)),
      showCreateModal: null,
    });
  },

  addComment: async (taskId, text, mentionIds = []) => {
    const comment = await api.createComment(taskId, text, mentionIds);
    set({ comments: [...get().comments, comment] });
    const activity = await api.getActivity(taskId);
    set({ activity });
  },

  uploadAttachment: async (taskId, file) => {
    const attachment = await api.uploadAttachment(taskId, file);
    set({ attachments: [...get().attachments, attachment] });
  },

  createSubtask: async (taskId, name) => {
    const subtask = await api.createSubtask(taskId, name);
    set({ subtasks: [...get().subtasks, subtask] });
    await get().refreshTaskExtras(taskId);
  },

  startTimer: async (taskId) => {
    const task = await api.startTimer(taskId);
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? task : t)) });
    await get().refreshTaskExtras(taskId);
  },

  stopTimer: async (taskId) => {
    const task = await api.stopTimer(taskId);
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? task : t)) });
    await get().refreshTaskExtras(taskId);
  },
}));
