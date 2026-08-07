export type Priority = 'urgent' | 'high' | 'normal' | 'low' | null;
export type ViewType = 'list' | 'board' | 'calendar' | 'table' | 'gantt' | 'timeline';
export type Role = 'owner' | 'admin' | 'member' | 'guest';
export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'comment'
  | 'mention'
  | 'status_change'
  | 'due_soon'
  | 'invite'
  | 'member_added';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: Role;
  status: 'active' | 'invited' | 'deactivated';
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  ownerId: string;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  orderindex: number;
  type: 'open' | 'custom' | 'closed';
}

export interface Space {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  private: boolean;
  memberIds: string[];
  statuses: Status[];
}

export interface Folder {
  id: string;
  spaceId: string;
  name: string;
  hidden: boolean;
}

export interface BoardList {
  id: string;
  spaceId: string;
  folderId: string | null;
  name: string;
  statuses: Status[];
}

export interface View {
  id: string;
  name: string;
  type: ViewType;
  parentType: 'space' | 'folder' | 'list';
  parentId: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  resolved: boolean;
  assigneeId?: string | null;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string;
  resolved: boolean;
}

export interface Task {
  id: string;
  listId: string;
  name: string;
  description: string;
  statusId: string;
  priority: Priority;
  assignees: string[];
  watchers: string[];
  tags: string[];
  dueDate: string | null;
  startDate: string | null;
  parentId: string | null;
  timeEstimate: number | null;
  timeSpent: number;
  orderindex: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  checklists: Checklist[];
  customFields: Record<string, unknown>;
}

export interface Tag {
  id: string;
  spaceId: string;
  name: string;
  color: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: 'task' | 'list' | 'space' | 'workspace';
  entityId: string;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  detail: string;
  createdAt: string;
}
