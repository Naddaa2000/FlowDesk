# FlowDesk Backend

## Setup
```bash
cd backend
npm install
cp .env.example .env   # set MONGODB_URI, TOKEN_SECRET
npm run seed           # admin / lead / member accounts
npm run dev
```

API: `http://localhost:4000/api/v1`

## Seed accounts
| Email | Password | Role |
|-------|----------|------|
| admin@flowdesk.app | password123 | admin |
| lead@flowdesk.app | password123 | member (project lead) |
| member@flowdesk.app | password123 | member |

## Permissions
- **Admin**: create project, assign lead, add/invite members, access all projects
- **Lead**: create project (becomes lead), add/invite members on their projects
- **Member**: only see/edit projects they belong to; create tasks, assign, comment, attach

## Main routes
- `POST /api/v1/auth/register|login` · `GET /auth/me`
- `GET/POST /api/v1/projects`
- `GET/PATCH/DELETE /api/v1/projects/:id`
- `GET/POST /api/v1/projects/:id/members` · `DELETE .../members/:userId`
- `POST /api/v1/projects/:id/statuses`
- `GET/POST /api/v1/projects/:id/tasks`
- `GET/PATCH/DELETE /api/v1/tasks/:id`
- `PUT /api/v1/tasks/:id/assignees` · `POST .../move`
- `GET/POST /api/v1/tasks/:id/comments`
- `GET/POST /api/v1/tasks/:id/attachments` (multipart `file`)
