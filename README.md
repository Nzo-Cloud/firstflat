# FirstFlat 🌿

> A budget tracker made for people living alone for the first time — students, fresh grads, and young professionals. Track income, expenses, and predict when your money runs out.

**Stack:** Next.js 14 (TypeScript + TailwindCSS) · ASP.NET Core Web API (.NET 10) · Supabase (Auth + PostgreSQL) · Anthropic Claude AI

---

## Features

- 💰 **Survival Mode Dashboard** — Hero balance with green/yellow/red indicator
- 📊 **Budget Overview** — Per-category spending vs limits with progress bars
- 🔮 **AI Spend Forecast** — Claude-powered prediction of when money runs out
- 📋 **Transactions** — Full CRUD with search and filters
- 🏷️ **Categories** — Essential vs non-essential with monthly limits
- 🧾 **Bills Tracker** — Recurring bills with due dates and paid/unpaid toggle
- ⚙️ **Settings** — Profile, currency, password, Ko-fi support link
- 🧙 **Onboarding Wizard** — 5-step setup after signup
- 🌍 **Worldwide currencies** — 35+ supported

---

## Project Structure

```
Firstflat/
├── frontend/          # Next.js 14 + TypeScript + TailwindCSS
├── backend/           # ASP.NET Core Web API (.NET 10)
├── supabase/
│   ├── schema.sql     # Run first
│   └── rls.sql        # Run second
└── README.md
```

---

## Prerequisites

- Node.js 18+
- .NET 10 SDK
- A Supabase project (free tier works)
- Anthropic API key (for Forecast feature)

---

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. In the **SQL Editor**, run in order:
   - `supabase/schema.sql`
   - `supabase/rls.sql`

3. Get these values from **Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT Secret` (Settings → API → JWT Settings) → `Supabase:JwtSecret`
   - `service_role` key → `Supabase:ServiceRoleKey`

4. Get your database connection string from **Settings → Database → Connection string (URI)** and format it for Npgsql:
   ```
   Host=db.YOUR_REF.supabase.co;Database=postgres;Username=postgres.YOUR_REF;Password=YOUR_DB_PASSWORD;Port=5432;SSL Mode=Require;Trust Server Certificate=true
   ```

---

## 2. Backend Setup (ASP.NET Core)

```bash
cd backend
cp appsettings.json appsettings.Development.json
```

Edit `appsettings.Development.json`:
```json
{
  "Supabase": {
    "Url": "https://YOUR_PROJECT_REF.supabase.co",
    "JwtSecret": "YOUR_JWT_SECRET",
    "ConnectionString": "Host=db.YOUR_REF.supabase.co;Database=postgres;Username=postgres.YOUR_REF;Password=YOUR_PASSWORD;Port=5432;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Anthropic": {
    "ApiKey": "sk-ant-YOUR_ANTHROPIC_API_KEY"
  },
  "AllowedOrigins": ["http://localhost:3000"]
}
```

```bash
dotnet restore
dotnet run
# API now at http://localhost:5000
```

---

## 3. Frontend Setup (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm install
npm run dev
# App now at http://localhost:3000
```

---

## 4. Environment Variables Reference

### Frontend (`.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Backend URL (http://localhost:5000 locally) |

### Backend (`appsettings.json`)
| Key | Description |
|-----|-------------|
| `Supabase:Url` | Supabase project URL |
| `Supabase:JwtSecret` | JWT secret (from Supabase API settings) |
| `Supabase:ConnectionString` | Direct PostgreSQL connection string |
| `Anthropic:ApiKey` | Anthropic API key for AI forecast |
| `AllowedOrigins` | Frontend URL(s) for CORS |

---

## 5. Deployment

### Frontend → Vercel

1. Push project to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL
5. Deploy

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, set **Root Directory** to `backend`
3. Railway will auto-detect .NET
4. Add environment variables (all the `Supabase:*` and `Anthropic:*` keys):
   ```
   Supabase__Url=https://...
   Supabase__JwtSecret=...
   Supabase__ConnectionString=...
   Anthropic__ApiKey=sk-ant-...
   AllowedOrigins__0=https://YOUR_APP.vercel.app
   ```
5. Deploy → copy the public URL → update `NEXT_PUBLIC_API_URL` in Vercel

> **Note:** Railway uses `__` as separator for nested JSON keys (e.g., `Supabase__JwtSecret` maps to `Supabase.JwtSecret`)

### Database → Supabase (free tier)

Already set up in Step 1. No additional deployment needed.

---

## 6. First Run

1. Open the app at `http://localhost:3000`
2. Click **Create free account** → fill in username, email, password
3. The 5-step onboarding wizard walks you through:
   - Setting your monthly income
   - Choosing your currency
   - Setting category limits
   - Adding recurring bills (optional)
4. You're taken to the dashboard — ready to track!

---

## Support ☕

If FirstFlat helped you manage your first apartment budget, consider supporting the developer at [ko-fi.com/kuwago](https://ko-fi.com/kuwago)!

---

## License

MIT — free to use and modify.
