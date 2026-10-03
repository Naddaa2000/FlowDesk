# FlowDesk API Reference (Node.js backend)

Base URL: `http://localhost:4000/api/v1`  
Auth: `Authorization: Bearer <jwt>` on all routes except auth.  
Email: fire transactional email on every event marked **✉ email**.

Hierarchy (ClickUp-style):

```
Workspace → Space → Folder (optional) → List → Task → Subtask
```

---

## 1. Auth

| Method | Endpoint | Body / Query | Notes |
|--------|----------|--------------|-------|
| POST | `/auth/register` | `{ name, email, password }` | Returns `{ user, token }` |
| POST | `/auth/login` | `{ email, password }` | Returns `{ user, token }` |
| GET | `/auth/me` | — | Current user |
| POST | `/auth/logout` | — | Invalidate token/session |
| POST | `/auth/forgot-password` | `{ email }` | ✉ reset link |
| POST | `/auth/reset-password` | `{ token, password }` | |
| POST | `/auth/verify-email` | `{ token }` | ✉ on register |

---

## 2. Workspaces (Projects / orgs)

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/workspaces` | — | Workspaces for current user |
| POST | `/workspaces` | `{ name, color? }` | Create |
| GET | `/workspaces/:workspaceId` | — | |
| PATCH | `/workspaces/:workspaceId` | `{ name?, color? }` | |
| DELETE | `/workspaces/:workspaceId` | — | Soft-delete recommended |

---

## 3. Members (workspace)

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/workspaces/:workspaceId/members` | — | |
| POST | `/workspaces/:workspaceId/members/invite` | `{ email, role, name? }` | ✉ invite email |
| PATCH | `/workspaces/:workspaceId/members/:userId` | `{ role? }` | |
| DELETE | `/workspaces/:workspaceId/members/:userId` | — | ✉ removed notice |
| POST | `/workspaces/:workspaceId/members/accept` | `{ inviteToken }` | Accept invite |

**Roles:** `owner` \| `admin` \| `member` \| `guest`

---

## 4. Spaces

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/workspaces/:workspaceId/spaces` | — | |
| POST | `/workspaces/:workspaceId/spaces` | `{ name, color?, private?, memberIds? }` | Seed default statuses |
| GET | `/spaces/:spaceId` | — | |
| PATCH | `/spaces/:spaceId` | `{ name?, color?, private? }` | |
| DELETE | `/spaces/:spaceId` | — | |
| GET | `/spaces/:spaceId/members` | — | |
| POST | `/spaces/:spaceId/members` | `{ userId }` | ✉ added to space |
| DELETE | `/spaces/:spaceId/members/:userId` | — | |

---

## 5. Folders

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/spaces/:spaceId/folders` | — | |
| POST | `/spaces/:spaceId/folders` | `{ name, parentFolderId? }` | Auto-create default List |
| GET | `/folders/:folderId` | — | |
| PATCH | `/folders/:folderId` | `{ name?, hidden? }` | |
| DELETE | `/folders/:folderId` | — | |

---

## 6. Lists (Boards)

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/spaces/:spaceId/lists` | — | Folderless + all |
| GET | `/folders/:folderId/lists` | — | |
| POST | `/lists` | `{ spaceId, folderId?, name }` | Inherit space statuses |
| GET | `/lists/:listId` | — | |
| PATCH | `/lists/:listId` | `{ name?, color?, assigneeId?, dueDate? }` | |
| DELETE | `/lists/:listId` | — | |
| GET | `/lists/:listId/members` | — | Explicit list members |
| POST | `/lists/:listId/members` | `{ userId }` | |
| DELETE | `/lists/:listId/members/:userId` | — | |

---

## 7. Statuses

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/lists/:listId/statuses` | — | Ordered |
| POST | `/lists/:listId/statuses` | `{ name, color, type? }` | `open` \| `custom` \| `closed` |
| PATCH | `/statuses/:statusId` | `{ name?, color?, type? }` | |
| DELETE | `/statuses/:statusId` | — | Reassign tasks first |
| PUT | `/lists/:listId/statuses/reorder` | `{ statusIds: string[] }` | |

Also optional space-level:

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/spaces/:spaceId/statuses` | — |
| POST | `/spaces/:spaceId/statuses` | `{ name, color, type? }` |

---

## 8. Views

Types: `list` \| `board` \| `calendar` \| `table` \| `gantt` \| `timeline` \| `workload`

| Method | Endpoint | Body / Query | Notes |
|--------|----------|--------------|-------|
| GET | `/views` | `?parentType=&parentId=` | |
| POST | `/views` | `{ name, type, parentType, parentId, settings? }` | |
| GET | `/views/:viewId` | — | |
| PATCH | `/views/:viewId` | `{ name?, filters?, grouping?, sorting?, columns? }` | |
| DELETE | `/views/:viewId` | — | |
| GET | `/views/:viewId/tasks` | `?page=` | Tasks as rendered by view |

---

## 9. Tasks

| Method | Endpoint | Body / Query | Notes |
|--------|----------|--------------|-------|
| GET | `/lists/:listId/tasks` | `?status=&assignees=&priority=&page=` | Max 100/page |
| POST | `/lists/:listId/tasks` | see below | ✉ assignees |
| GET | `/tasks/:taskId` | — | Full detail |
| PATCH | `/tasks/:taskId` | partial fields | ✉ watchers on important changes |
| DELETE | `/tasks/:taskId` | — | ✉ assignees |
| PUT | `/tasks/:taskId/assignees` | `{ assigneeIds: string[] }` | ✉ newly assigned |
| POST | `/tasks/:taskId/move` | `{ listId?, statusId?, orderindex? }` | ✉ status change |
| POST | `/tasks/:taskId/watchers` | `{ userId }` | |
| DELETE | `/tasks/:taskId/watchers/:userId` | — | |
| GET | `/workspaces/:workspaceId/tasks/search` | `?q=` | Full-text |
| POST | `/tasks/:taskId/duplicate` | — | |
| POST | `/tasks/:taskId/merge` | `{ sourceTaskIds }` | |
| GET | `/tasks/:taskId/subtasks` | — | |
| POST | `/tasks/:taskId/subtasks` | `{ name, ... }` | Create child |

**Create/Update task body:**

```json
{
  "name": "string",
  "description": "string",
  "statusId": "string",
  "priority": "urgent|high|normal|low|null",
  "assignees": ["userId"],
  "tags": ["bug"],
  "dueDate": "ISO8601|null",
  "startDate": "ISO8601|null",
  "parentId": "string|null",
  "timeEstimate": 3600000,
  "customFields": {}
}
```

---

## 10. Tags

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/spaces/:spaceId/tags` | — |
| POST | `/spaces/:spaceId/tags` | `{ name, color }` |
| PATCH | `/tags/:tagId` | `{ name?, color? }` |
| DELETE | `/tags/:tagId` | — |
| POST | `/tasks/:taskId/tags` | `{ tagName }` |
| DELETE | `/tasks/:taskId/tags/:tagName` | — |

---

## 11. Comments

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/tasks/:taskId/comments` | `?start=&startId=` | Paginated |
| POST | `/tasks/:taskId/comments` | `{ text, assigneeId?, mentions? }` | ✉ watchers / mentions |
| PATCH | `/comments/:commentId` | `{ text?, resolved? }` | |
| DELETE | `/comments/:commentId` | — | |
| GET | `/comments/:commentId/replies` | — | Threads |
| POST | `/comments/:commentId/replies` | `{ text }` | ✉ |

---

## 12. Checklists

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/tasks/:taskId/checklists` | `{ name }` |
| PATCH | `/checklists/:checklistId` | `{ name?, orderindex? }` |
| DELETE | `/checklists/:checklistId` | — |
| POST | `/checklists/:checklistId/items` | `{ name, assigneeId? }` |
| PATCH | `/checklist-items/:itemId` | `{ name?, resolved?, assigneeId?, parentItemId? }` |
| DELETE | `/checklist-items/:itemId` | — |

---

## 13. Dependencies & links

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/tasks/:taskId/dependencies` | `{ dependsOnTaskId, type: "waiting_on"|"blocking" }` |
| DELETE | `/tasks/:taskId/dependencies/:dependsOnTaskId` | — |
| POST | `/tasks/:taskId/links` | `{ linkedTaskId }` |
| DELETE | `/tasks/:taskId/links/:linkedTaskId` | — |

---

## 14. Attachments

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/tasks/:taskId/attachments` | — | |
| POST | `/tasks/:taskId/attachments` | `multipart/form-data` field `file` | ✉ watchers optional |
| DELETE | `/attachments/:attachmentId` | — | |

---

## 15. Custom fields

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/lists/:listId/custom-fields` | — |
| POST | `/lists/:listId/custom-fields` | `{ name, type, typeConfig? }` |
| PATCH | `/custom-fields/:fieldId` | `{ name?, typeConfig? }` |
| DELETE | `/custom-fields/:fieldId` | — |
| PUT | `/tasks/:taskId/custom-fields/:fieldId` | `{ value }` |
| DELETE | `/tasks/:taskId/custom-fields/:fieldId` | — |

**Field types:** `text`, `number`, `date`, `dropdown`, `labels`, `checkbox`, `url`, `email`, `phone`, `currency`, `users`, `tasks`, `progress`, `rating`, `location`

---

## 16. Time tracking

| Method | Endpoint | Body / Query |
|--------|----------|--------------|
| GET | `/workspaces/:workspaceId/time-entries` | `?start=&end=&assignee=&taskId=` |
| POST | `/workspaces/:workspaceId/time-entries` | `{ taskId, start, end?, description? }` |
| GET | `/time-entries/:entryId` | — |
| PATCH | `/time-entries/:entryId` | `{ start?, end?, description? }` |
| DELETE | `/time-entries/:entryId` | — |
| POST | `/tasks/:taskId/timer/start` | — |
| POST | `/tasks/:taskId/timer/stop` | — |
| GET | `/timer/running` | — |

---

## 17. Notifications & email preferences ✉

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/notifications` | `?unreadOnly=` | Inbox |
| PATCH | `/notifications/:id/read` | — | |
| POST | `/notifications/read-all` | — | |
| DELETE | `/notifications/:id` | — | |
| GET | `/notifications/preferences` | — | |
| PUT | `/notifications/preferences` | see below | Per-event email toggles |

**Preference shape:**

```json
{
  "email": {
    "task_assigned": true,
    "task_updated": true,
    "comment": true,
    "mention": true,
    "status_change": true,
    "due_soon": true,
    "invite": true,
    "member_added": true
  },
  "inApp": { "...same keys...": true }
}
```

### Events that should send email (backend jobs)

| Event | Who gets email |
|-------|----------------|
| Member invited | Invitee |
| Task created & assigned | Assignees |
| Assignees changed | Newly added assignees |
| Status changed | Assignees + watchers |
| Comment / mention | Watchers / mentioned users |
| Due soon / overdue (cron) | Assignees |
| Added to space/list | Added member |
| Removed from workspace | Removed user |

Use a queue (BullMQ / Agenda) + Nodemailer / Resend / SES.

---

## 18. Activity / audit

| Method | Endpoint | Query |
|--------|----------|-------|
| GET | `/tasks/:taskId/activity` | `?page=` |
| GET | `/lists/:listId/activity` | |
| GET | `/workspaces/:workspaceId/activity` | |

---

## 19. Global search

| Method | Endpoint | Query |
|--------|----------|-------|
| GET | `/search` | `?q=&types=task,list,doc,user` |

---

## 20. Goals (OKRs)

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/workspaces/:workspaceId/goals` | — |
| POST | `/workspaces/:workspaceId/goals` | `{ name, description?, dueDate?, owners?, color? }` |
| GET | `/goals/:goalId` | — |
| PATCH | `/goals/:goalId` | partial |
| DELETE | `/goals/:goalId` | — |
| POST | `/goals/:goalId/key-results` | `{ name, type, target }` |
| PATCH | `/key-results/:id` | `{ steps_current?, name? }` |
| DELETE | `/key-results/:id` | — |

---

## 21. Docs

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/workspaces/:workspaceId/docs` | `?q=` |
| POST | `/workspaces/:workspaceId/docs` | `{ name, parentId? }` |
| GET | `/docs/:docId` | — |
| GET | `/docs/:docId/pages` | — |
| POST | `/docs/:docId/pages` | `{ name, content?, parentPageId? }` |
| GET | `/pages/:pageId` | — |
| PATCH | `/pages/:pageId` | `{ name?, content? }` |
| DELETE | `/pages/:pageId` | — |

---

## 22. Chat (optional parity)

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/workspaces/:workspaceId/channels` | — |
| POST | `/workspaces/:workspaceId/channels` | `{ name, memberIds? }` |
| GET | `/channels/:channelId/messages` | `?before=` |
| POST | `/channels/:channelId/messages` | `{ text }` ✉ mentions |
| PATCH | `/messages/:messageId` | `{ text }` |
| DELETE | `/messages/:messageId` | — |

---

## 23. Webhooks

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/workspaces/:workspaceId/webhooks` | — |
| POST | `/workspaces/:workspaceId/webhooks` | `{ endpoint, events[], secret? }` |
| PATCH | `/webhooks/:webhookId` | partial |
| DELETE | `/webhooks/:webhookId` | — |

**Suggested events:** `task.created`, `task.updated`, `task.deleted`, `task.assigned`, `task.status_changed`, `comment.created`, `list.created`, `space.created`, `member.invited`

---

## 24. Suggested Mongo models

```
User, Workspace, WorkspaceMember, Space, SpaceMember,
Folder, List, Status, View, Task, TaskAssignee, Tag, TaskTag,
Comment, Checklist, ChecklistItem, Attachment, CustomField,
CustomFieldValue, TimeEntry, Notification, NotificationPreference,
Activity, Goal, KeyResult, Doc, Page, Webhook, Invite
```

---

## 25. Standard response envelope

```json
{
  "success": true,
  "data": {},
  "message": "optional",
  "meta": { "page": 1, "limit": 100, "total": 240 }
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "required" }]
}
```

---

## 26. Node.js stack suggestion

- Express (matches your existing `backend/`)
- Mongoose
- JWT + bcrypt
- Multer (attachments)
- Nodemailer / Resend
- BullMQ + Redis (email & due-date jobs)
- socket.io (optional live notifications)
- celebrate / zod / class-validator for DTOs

Frontend client already mirrors these routes in `frontend/src/api/client.ts`.  
Set `VITE_API_URL=http://localhost:4000/api/v1` when you wire the real backend.
