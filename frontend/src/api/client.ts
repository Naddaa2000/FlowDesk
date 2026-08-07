const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

function getToken() {
  return localStorage.getItem('flowdesk_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('flowdesk_token', token);
  else localStorage.removeItem('flowdesk_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || res.statusText || 'Request failed');
  }
  return (json.data ?? json.result ?? json) as T;
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ user: ApiUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: ApiUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<{ user: ApiUser }>('/auth/me'),

  logout: () => request<null>('/auth/logout', { method: 'POST' }),

  getUsers: () => request<ApiUser[]>('/users'),

  getProjects: () => request<ApiProject[]>('/projects'),

  createProject: (body: {
    name: string;
    description?: string;
    color?: string;
    leadId?: string;
  }) =>
    request<ApiProject>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getProject: (id: string) => request<ApiProject>(`/projects/${id}`),

  updateProject: (id: string, body: Record<string, unknown>) =>
    request<ApiProject>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteProject: (id: string) =>
    request<null>(`/projects/${id}`, { method: 'DELETE' }),

  getMembers: (projectId: string) =>
    request<ApiProjectMember[]>(`/projects/${projectId}/members`),

  addMember: (
    projectId: string,
    body: { userId?: string; email?: string; name?: string; role?: string },
  ) =>
    request<ApiProjectMember>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  removeMember: (projectId: string, userId: string) =>
    request<null>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),

  addStatus: (projectId: string, body: { name: string; color: string; type?: string }) =>
    request<ApiStatus>(`/projects/${projectId}/statuses`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateStatus: (
    projectId: string,
    statusId: string,
    body: { name?: string; color?: string; type?: string; orderindex?: number },
  ) =>
    request<ApiStatus>(`/projects/${projectId}/statuses/${statusId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteStatus: (projectId: string, statusId: string) =>
    request<{ movedToStatusId: string }>(
      `/projects/${projectId}/statuses/${statusId}`,
      { method: 'DELETE' },
    ),

  reorderStatuses: (projectId: string, orderedIds: string[]) =>
    request<ApiStatus[]>(`/projects/${projectId}/statuses/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),

  getTasks: (projectId: string, q?: string) =>
    request<ApiTask[]>(
      `/projects/${projectId}/tasks${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),

  createTask: (projectId: string, body: Record<string, unknown>) =>
    request<ApiTask>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTask: (id: string) => request<ApiTask>(`/tasks/${id}`),

  updateTask: (id: string, body: Record<string, unknown>) =>
    request<ApiTask>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteTask: (id: string) =>
    request<null>(`/tasks/${id}`, { method: 'DELETE' }),

  assignTask: (id: string, assigneeIds: string[]) =>
    request<ApiTask>(`/tasks/${id}/assignees`, {
      method: 'PUT',
      body: JSON.stringify({ assigneeIds }),
    }),

  moveTask: (id: string, body: { statusId?: string; orderindex?: number }) =>
    request<ApiTask>(`/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getComments: (taskId: string) =>
    request<ApiComment[]>(`/tasks/${taskId}/comments`),

  createComment: (taskId: string, text: string, mentionIds?: string[]) =>
    request<ApiComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, mentionIds: mentionIds || [] }),
    }),

  getAttachments: (taskId: string) =>
    request<ApiAttachment[]>(`/tasks/${taskId}/attachments`),

  uploadAttachment: async (taskId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ApiAttachment>(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: form,
    });
  },

  deleteAttachment: (taskId: string, attachmentId: string) =>
    request<null>(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),

  getActivity: (taskId: string) =>
    request<ApiActivity[]>(`/tasks/${taskId}/activity`),

  getSubtasks: (taskId: string) =>
    request<ApiTask[]>(`/tasks/${taskId}/subtasks`),

  createSubtask: (taskId: string, name: string) =>
    request<ApiTask>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  startTimer: (taskId: string) =>
    request<ApiTask>(`/tasks/${taskId}/timer/start`, { method: 'POST' }),

  stopTimer: (taskId: string) =>
    request<ApiTask>(`/tasks/${taskId}/timer/stop`, { method: 'POST' }),

  getRecentEmails: () =>
    request<
      {
        id: string;
        to: string;
        subject: string;
        mode: string;
        previewUrl: string | null;
        at: string;
        error?: string;
      }[]
    >('/emails'),
};

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: string;
  avatarColor: string;
}

export interface ApiStatus {
  id: string;
  name: string;
  color: string;
  orderindex: number;
  type: string;
}

export interface ApiProjectMember {
  id: string;
  role: 'lead' | 'developer' | 'qa';
  status: string;
  user: ApiUser;
}

export interface ApiProject {
  id: string;
  name: string;
  description: string;
  color: string;
  leadId: string;
  lead?: ApiUser;
  statuses: ApiStatus[];
  memberIds: string[];
  members?: ApiProjectMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiChecklistItem {
  id: string;
  name: string;
  resolved: boolean;
  assigneeId: string | null;
}

export interface ApiChecklist {
  id: string;
  name: string;
  items: ApiChecklistItem[];
}

export interface ApiTask {
  id: string;
  projectId: string;
  name: string;
  description: string;
  statusId: string;
  priority: 'urgent' | 'high' | 'normal' | 'low' | null;
  assignees: ApiUser[] | { id: string }[];
  assigneeIds: string[];
  watchers: string[];
  tags: string[];
  dueDate: string | null;
  startDate: string | null;
  timeEstimate: number | null;
  timeSpent: number;
  timerStartedAt: string | null;
  points: number | null;
  parentId: string | null;
  orderindex: number;
  createdBy: string;
  checklists: ApiChecklist[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiActivity {
  id: string;
  action: string;
  detail: string;
  user: ApiUser;
  createdAt: string;
}

export interface ApiComment {
  id: string;
  taskId: string;
  text: string;
  resolved: boolean;
  mentions?: ApiUser[];
  mentionIds?: string[];
  user: ApiUser;
  createdAt: string;
}

export interface ApiAttachment {
  id: string;
  taskId: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: ApiUser;
  createdAt: string;
}

export const fileUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  const root = BASE.replace(/\/api\/v1$/, '');
  return `${root}${url}`;
};
