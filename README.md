# FlowDesk

ClickUp-style project management: **Projects** (one lead) → members → tasks → comments / attachments.

## Quick start

### 1. Backend
```bash
cd backend
npm install
# edit .env with your MONGODB_URI + TOKEN_SECRET
npm run seed
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Seed logins
- `admin@flowdesk.app` / `password123` — create projects, assign leads, add members
- `lead@flowdesk.app` / `password123` — project lead
- `member@flowdesk.app` / `password123` — member (only sees joined projects)

## Roles

**Global**
- `admin` — only platform admin role

**On a project**
- `lead` — manage groups, invite teammates
- `developer` — work on tasks
- `qa` — work on tasks

## Emails

Without SMTP, emails use Ethereal (not your real inbox). After an assign/mention:
1. Click **Emails** in the top bar, or
2. Open the preview URL printed in the backend console

For real delivery, set in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app_password
EMAIL_FROM=FlowDesk <you@gmail.com>
```
