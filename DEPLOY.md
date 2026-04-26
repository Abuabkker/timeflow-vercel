# TimeFlow — Deploy to Vercel + Supabase (100% Free)

## What You Need (all free accounts)
- github.com
- supabase.com
- vercel.com
- Gmail account (for monthly report emails)

---

## STEP 1 — Supabase Database Setup

1. Go to **supabase.com** → Sign Up → New Project
   - Name: `timeflow`
   - Password: (save this somewhere)
   - Region: **Southeast Asia (Singapore)** — closest to Sri Lanka
   - Click **Create new project** and wait ~2 minutes

2. Once ready, click **SQL Editor** in the left sidebar

3. Click **New Query**, paste the entire contents of `supabase/schema.sql`, click **Run**
   - You should see "Success. No rows returned"
   - This creates all tables AND the default admin (PIN: 0000)

4. Go to **Project Settings → API** and copy these two values:
   - **Project URL** → looks like `https://abcdefghij.supabase.co`
   - **service_role key** (under "Project API Keys") → long JWT string starting with `eyJ...`
   - ⚠️ Use `service_role` NOT `anon` key — service key bypasses RLS

---

## STEP 2 — Push to GitHub

```bash
cd timeflow-vercel
git init
git add .
git commit -m "TimeFlow initial commit"
```

Go to **github.com/new** → create repo named `timeflow` (private) → then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/timeflow.git
git push -u origin main
```

---

## STEP 3 — Deploy to Vercel

1. Go to **vercel.com** → Sign Up with GitHub → **Add New Project**
2. Import your `timeflow` GitHub repo
3. **Framework Preset**: Vite
4. **Root Directory**: leave as `/` (root)
5. **Build Command**: `cd frontend && npm install && npm run build`
6. **Output Directory**: `frontend/dist`

7. Under **Environment Variables**, add ALL of these:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key |
| `JWT_SECRET` | Run `openssl rand -hex 64` and paste result |
| `EMAIL_USER` | your Gmail address |
| `EMAIL_PASS` | Your Gmail App Password (see below) |
| `ADMIN_EMAIL` | admin@paraloxmedia.com |
| `COMPANY_NAME` | Paralox Media |

8. Click **Deploy** — wait ~2 minutes

9. Your app is live at: `https://timeflow-xxxx.vercel.app` 🎉

---

## STEP 4 — Gmail App Password

1. Go to **myaccount.google.com** → Security → 2-Step Verification (enable it)
2. Search **"App passwords"** → Create → Name it "TimeFlow"
3. Copy the 16-character password → paste as `EMAIL_PASS` in Vercel

---

## STEP 5 — Custom Domain (Optional)

1. Vercel → Project → Settings → Domains → Add `timeflow.paraloxmedia.com`
2. In **Register.lk** DNS, add:
   - Type: `CNAME`
   - Name: `timeflow`
   - Value: `cname.vercel-dns.com`
3. SSL is automatic ✅

---

## Login After Deploy

Open your Vercel URL → you'll see the login screen

| User | PIN |
|------|-----|
| Admin | `0000` |

> ⚠️ Go to **Admin → Employees → Edit** → change admin PIN immediately!

---

## Monthly Report

- **Auto**: Runs 1st of every month at 8AM — PDF emailed to ADMIN_EMAIL
  - Note: Vercel serverless functions don't support cron jobs on free tier
  - Use Vercel's built-in cron (Pro) OR trigger manually
- **Manual**: Admin → Reports → pick month/year → "Generate & Email"
- **Download**: Admin → Reports → select report → "Download PDF"

### Free Cron Alternative
Add a free cron job at **cron-job.org**:
- URL: `https://your-app.vercel.app/api/reports`  
- Method: POST  
- Headers: `Authorization: Bearer YOUR_ADMIN_JWT`
- Body: `{"month": 0, "year": 0, "sendEmail": true}` (0 = auto previous month)
- Schedule: 1st of every month, 08:00

---

## Project Structure

```
timeflow-vercel/
├── api/                      ← Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js          POST /api/auth/login
│   │   └── me.js             GET  /api/auth/me
│   ├── users/
│   │   ├── index.js          GET/POST /api/users
│   │   ├── full.js           GET /api/users/full
│   │   └── [id].js           PUT/DELETE /api/users/:id
│   ├── sessions/
│   │   ├── today.js          GET /api/sessions/today
│   │   ├── checkin.js        POST /api/sessions/checkin
│   │   ├── checkout.js       POST /api/sessions/checkout
│   │   ├── break.js          POST /api/sessions/break?action=start|end
│   │   ├── tasks.js          POST/PATCH /api/sessions/tasks
│   │   └── admin.js          GET /api/sessions/admin?date=
│   └── reports/
│       └── index.js          GET/POST /api/reports
├── lib/
│   ├── supabase.js           Supabase client
│   └── auth.js               JWT verify + CORS helper
├── frontend/                 React + Vite app
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── EmployeePage.jsx
│       │   └── admin/
│       │       ├── AdminLayout.jsx
│       │       ├── AdminOverview.jsx
│       │       ├── AdminEmployees.jsx
│       │       └── AdminReports.jsx
│       ├── context/AuthContext.jsx
│       └── utils/
│           ├── api.js
│           └── helpers.js
├── supabase/
│   └── schema.sql            Run once in Supabase SQL Editor
├── vercel.json               Routing config
└── package.json
```

---

## Free Tier Limits

| Service | Free Limit | Enough? |
|---------|-----------|---------|
| Vercel | 100GB bandwidth, unlimited deploys | ✅ Yes |
| Supabase | 500MB DB, 2GB bandwidth | ✅ Yes |
| Gmail SMTP | 500 emails/day | ✅ Yes (1 report/month) |
| **Total cost** | **$0/month** | ✅ |
