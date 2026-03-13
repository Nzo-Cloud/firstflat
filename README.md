# FirstFlat 🌿

> Budget smarter. Live better.

**The budget tracker built for people living alone for the first time.**

[![Live Site](https://img.shields.io/badge/Live%20Site-firstflat.vercel.app-green?style=flat-square)](https://firstflat.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Nzo--Cloud%2Ffirstflat-black?style=flat-square&logo=github)](https://github.com/Nzo-Cloud/firstflat)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-10.0-purple?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com)

---

## What Is This

FirstFlat is a free budget tracker designed for people who are living alone for the first time — students, fresh graduates, and young professionals who need help figuring out where their money goes.

Most budget apps are built for people who already know how to budget. FirstFlat is built for people who are learning.

**No ads. No paywalls. No payment information required.**

---

## Features

- **Survival Mode Dashboard** — One big number showing exactly how much money you have left this month, color-coded green/yellow/red based on how close you are to running out
- **Spend Forecast** — AI-powered prediction of when your budget will run out based on your spending pattern, with actionable suggestions to cut back
- **Essential vs Non-Essential Tagging** — Categorize every expense so you can see at a glance what you need vs what you want
- **Bill Reminders** — Track recurring bills with due dates so you never miss rent or utilities again
- **Budget Overview** — Per-category spending vs your monthly limits with progress bars and CSV export
- **Onboarding Wizard** — 5-step setup that guides first-timers through setting income, currency, category limits, and recurring bills
- **Multi-Currency Support** — 35+ currencies for users worldwide
- **Secure Per-User Data** — Row Level Security ensures users only ever see their own data

---

## Why I Built This

I'm a junior software developer from Davao, Philippines, planning to move abroad with my girlfriend once I land my first job. Before that happens, we need to get serious about budgeting — saving for visa fees, flights, deposits, and everything else that comes with starting fresh somewhere new.

I couldn't find a budget app that felt approachable for someone just starting out. Most were either too complex or too basic. So I built FirstFlat — partly to solve a real problem, and partly to learn the skills I need to get hired.

---

## Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend | Next.js 14 + TypeScript | Already familiar from previous projects, strong ecosystem |
| Backend | ASP.NET Core 10 Web API | Learning C# for junior developer roles — this was my first production REST API |
| Database + Auth | Supabase (PostgreSQL) | Free tier, built-in auth, Row Level Security for per-user data isolation |
| Frontend Deploy | Vercel | Free, seamless Next.js integration |
| Backend Deploy | Render.com (Docker) | Free tier, supports .NET via Docker containers |
| Keep-Alive | UptimeRobot | Prevents Render free tier cold starts at zero cost |
| AI Forecast | Anthropic Claude API | Best structured JSON output for financial analysis |

---

## Architecture

```
User Browser
     │
     ▼
Next.js Frontend (Vercel)
     │
     ├── Supabase Auth (JWT tokens)
     │
     └── ASP.NET Core API (Render.com)
              │
              ├── Supabase PostgreSQL (database)
              │    └── Row Level Security (per-user isolation)
              │
              └── Anthropic Claude API (spend forecast)
```

---

## What I Learned Building This

- **JWT authentication across separate services** — Supabase issues tokens on the frontend; the ASP.NET backend validates them using JWKS discovery. Debugging the redirect loop that happened when the backend rejected valid tokens taught me how auth flows actually work in production.

- **Docker deployment on Render** — Render detected Node.js instead of .NET because of a `package-lock.json` in the root. Learning why Docker build context matters and how multi-stage builds work was a real lesson in deployment infrastructure.

- **Row Level Security in PostgreSQL** — Setting up RLS policies so users can only read and write their own data, and understanding how Supabase enforces this at the database level.

- **Connecting three separate services** — Frontend, backend, and database each deployed separately with their own environment variables and CORS configuration. Getting them to trust each other in production was harder than expected.

- **Graceful degradation** — When the AI forecast feature had no API credits, instead of showing a crash, the app falls back to showing real database stats with a friendly message. Handling failures gracefully is something you only learn by watching things fail.

---

## Local Development

### Prerequisites

- Node.js 18+
- .NET 10 SDK
- Supabase account

### Setup

```bash
# Clone the repo
git clone https://github.com/Nzo-Cloud/firstflat.git
cd firstflat
```

### Backend

```bash
cd backend
```

Create `appsettings.Development.json`:

```json
{
  "Supabase": {
    "Url": "YOUR_SUPABASE_URL",
    "JwtSecret": "YOUR_JWT_SECRET",
    "ConnectionString": "YOUR_CONNECTION_STRING"
  },
  "Anthropic": {
    "ApiKey": "YOUR_ANTHROPIC_API_KEY"
  },
  "AllowedOrigins": [
    "http://localhost:3000"
  ]
}
```

```bash
dotnet run
# Runs on http://localhost:5147
```

### Frontend

```bash
cd frontend
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:5147
```

```bash
npm install
npm run dev
# Runs on http://localhost:3000
```

### Database

Run these SQL files in your Supabase SQL Editor in order:

1. `supabase/schema.sql`
2. `supabase/rls.sql`

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Auto-deploys on push to main |
| Backend | Render.com | Docker runtime, free tier |
| Database | Supabase | Free tier, Southeast Asia region |

---

## Support

FirstFlat is completely free. If it helped you, consider buying me a coffee — it goes toward keeping the app running and getting a real domain.

[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-orange?style=flat-square&logo=ko-fi)](https://ko-fi.com/kuwago)

---

## Built By

**Lorenzo Balitian** — Junior Software Developer, Davao, Philippines

[![Portfolio](https://img.shields.io/badge/Portfolio-View-blue?style=flat-square)](https://portfolio-xi-liart-nvfg0cuod0.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Nzo--Cloud-black?style=flat-square&logo=github)](https://github.com/Nzo-Cloud)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/lorenzo-balitian)