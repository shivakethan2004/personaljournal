# Process Journal — Project Documentation

**Version:** 0.1.0  
**Phase:** 1 (Scaffold)  
**Last Updated:** 2026-08-15

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [File Structure](#file-structure)
6. [Core Concepts](#core-concepts)
7. [Key Features](#key-features)
8. [Authentication Flow](#authentication-flow)
9. [Data Models](#data-models)
10. [Environment Configuration](#environment-configuration)

---

## Project Overview

**Process Journal** is a Next.js web application designed to help users track, understand, and overcome psychological patterns that block progress in their personal and professional lives.

### Purpose

The app provides a structured system for:
- Identifying 12 common psychological problem patterns (e.g., "immediate-reward dependence", "planning as substitute for execution")
- Tracking metrics designed to make these patterns visible and measurable
- Logging daily activities and reflections to build awareness
- Extracting insights through AI-powered weekly reviews

### Target Users

Individual users tracking personal growth, productivity, or behavioral change across multiple life domains (work, health, creative projects, relationships, etc.).

### Core Philosophy

Rather than relying on willpower or vague intentions, the app makes patterns visible through **concrete, measurable logging**. Users tap counters, write notes, or record time intervals to collect data on their own behavior. Weekly AI reviews transform that raw data into actionable insight.

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16.3.1 (React 19.2.8, Server Components)
- **Styling:** Tailwind CSS 4, PostCSS
- **UI Components:** Radix UI primitives, custom shadow-DOM components
- **Icons:** Lucide React
- **State Management:** React Context (Auth), Server State (Supabase)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (email/password, OAuth via Supabase)
- **Real-time:** Supabase Realtime (listening to auth changes)
- **Server Functions:** Supabase Edge Functions (for AI-powered weekly summaries)
- **External AI:** Together AI (API for generating weekly insights; server-side only)

### DevOps & Tooling
- **Package Manager:** npm
- **Linting:** ESLint 9
- **TypeScript:** ^5
- **Version Control:** Git (integrated with Supabase CLI)
- **Deployment:** Vercel (assumed; built-in Next.js support)

### Key Dependencies
```json
{
  "@supabase/ssr": "^0.12.4",
  "@supabase/supabase-js": "^2.112.3",
  "next": "16.3.1",
  "react": "19.2.8",
  "tailwindcss": "^4"
}
```

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                           │
│  (Next.js Client Components + Server Components)            │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
    ┌───▼────────────────┐    ┌─────────────▼──────────────┐
    │  Supabase Client   │    │  Supabase Middleware       │
    │  (SSR integration) │    │  (Session management)      │
    └───┬────────────────┘    └─────────────┬──────────────┘
        │                                   │
        └──────────┬────────────────────────┘
                   │
        ┌──────────▼──────────────────────────────────┐
        │   Supabase Platform                        │
        │  ┌────────────────────────────────────┐    │
        │  │  PostgreSQL Database               │    │
        │  │  • profiles                        │    │
        │  │  • problem_patterns (lib)          │    │
        │  │  • metrics_library (lib)           │    │
        │  │  • custom_metrics (user)           │    │
        │  │  • user_metrics (user tracking)    │    │
        │  │  • activities (user domains)       │    │
        │  │  • daily_plans                     │    │
        │  │  • quick_logs                      │    │
        │  │  • evening_reflections             │    │
        │  │  • onboarding_responses            │    │
        │  └────────────────────────────────────┘    │
        │  ┌────────────────────────────────────┐    │
        │  │  Auth System                       │    │
        │  │  • Email/password signup & login   │    │
        │  │  • Session management              │    │
        │  │  • RLS policies (row-level sec.)   │    │
        │  └────────────────────────────────────┘    │
        │  ┌────────────────────────────────────┐    │
        │  │  Edge Functions                    │    │
        │  │  • weekly-summary (AI reviews)     │    │
        │  └────────────────────────────────────┘    │
        └──────────────────────────────────────────────┘
                           │
        ┌──────────────────┴────────────────────┐
        │                                       │
    ┌───▼────────────────┐    ┌────────────────▼───┐
    │   Together AI       │    │  Environment       │
    │   (API calls)       │    │  (.env.local)      │
    └────────────────────┘    └────────────────────┘
```

### Request Flow (Example: User Creates a Quick Log)

1. **Client Action** → User taps "Log" button in the quick-log widget
2. **Server Action** → `app/quick-log/actions.ts` processes the log
3. **Supabase Insert** → Log saved to `quick_logs` table with user_id (RLS enforced)
4. **Response** → Client receives result, optionally shows recovery-gap confirmation
5. **Real-time Sync** → Other tabs may update via auth state change listener

### Session & Auth Flow

1. **Middleware** (`middleware.ts`) runs on every request
2. **updateSession** refreshes Supabase auth token if needed
3. **AuthProvider** initializes with server-side session info
4. **useAuth hook** allows components to read user state
5. **Sign-out** clears session and redirects to `/login`

---

## Database Schema

### Core Tables

#### `profiles`
```sql
id (uuid, PK, FK → auth.users)
display_name (text)
created_at (timestamptz)
```
- **Purpose:** User profile metadata
- **RLS:** Each user can only read/write/update their own row
- **Trigger:** Auto-created when auth user signs up

#### `problem_patterns`
```sql
id (uuid, PK)
name (text, NOT NULL)
description (text, NOT NULL)
```
- **Purpose:** Pre-seeded library of 12 psychological patterns (shared, public read-only)
- **RLS:** Public read access; no write by users
- **Examples:**
  - Immediate-reward dependence
  - Novelty/strategy switching
  - Outcome attachment
  - Uncertainty spiraling
  - etc. (12 total)

#### `metrics_library`
```sql
id (uuid, PK)
name (text, NOT NULL)
description (text, NOT NULL)
why_it_helps (text, NOT NULL)
input_type (text: 'number' | 'text' | 'timer' | 'tally')
problem_pattern_id (uuid, FK → problem_patterns)
```
- **Purpose:** Pre-seeded metrics designed to help users observe specific patterns
- **RLS:** Public read access
- **Examples:**
  - "Delay tolerance tally" (observes immediate-reward dependence)
  - "Strategy switch log" (observes novelty switching)
  - "Recovery time" (timer-based, observes outcome-dependent confidence)

#### `custom_metrics`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
name (text, NOT NULL)
description (text)
input_type (text: 'number' | 'text' | 'timer' | 'tally')
```
- **Purpose:** User-created metrics beyond the library
- **RLS:** Users can only read/write/update/delete their own rows

#### `user_metrics`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
metric_id (uuid, FK → metrics_library)
custom_metric_id (uuid, FK → custom_metrics)
active (boolean, NOT NULL, default true)
```
- **Purpose:** Join table; tracks which library + custom metrics each user actually monitors
- **Constraint:** XOR — exactly one of metric_id or custom_metric_id is non-null
- **RLS:** Users can only read/write/update/delete their own rows

#### `activities`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
name (text, NOT NULL)
description (text)
active (boolean, NOT NULL, default true)
created_at (timestamptz, NOT NULL)
```
- **Purpose:** User-defined life domains/projects (e.g., "gym", "cold-calling sales", "writing book")
- **RLS:** Users can only read/write/update/delete their own rows

#### `daily_plans`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
entry_date (text, YYYY-MM-DD)
activity_id (uuid, FK → activities, NOT NULL)
objective_text (text)
motivation (number, 0-10)
created_at (timestamptz)
```
- **Purpose:** Morning planning — user sets one objective + motivation level per activity per day
- **RLS:** Users can only read/write/update/delete their own rows

#### `quick_logs`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
timestamp (timestamptz, NOT NULL)
activity_id (uuid, FK → activities, NOT NULL)
metric_id (uuid, FK → metrics_library)
custom_metric_id (uuid, FK → custom_metrics)
tag ('setback' | 'resume' | null)
content (text)
value (number)
```
- **Purpose:** Moment-to-moment logging throughout the day
- **RLS:** Users can only read/write/update/delete their own rows
- **Tag Field:** "setback" = I hit a problem; "resume" = I'm back to work; null = routine log
- **Content Field:** Used for "text" and "tally" input types
- **Value Field:** Used for "number" and "timer" input types

#### `recovery_gap_confirmations`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
quick_log_id (uuid, FK → quick_logs, NOT NULL)
gap_seconds (number, NOT NULL)
user_confirmed ('recovering' | 'break' | null)
```
- **Purpose:** When a "resume" log is created, if the gap is > threshold, ask user whether that gap was recovery (learning from setback) or a break (unrelated)
- **RLS:** Users can only read/write/update/delete their own rows

#### `evening_reflections`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
entry_date (text, YYYY-MM-DD)
responses (jsonb)
created_at (timestamptz)
```
- **Purpose:** End-of-day reflections on selected metrics
- **RLS:** Users can only read/write/update/delete their own rows
- **Responses Format:**
  ```json
  {
    "metric_key_1": { "text": "...", "activity_id": "..." },
    "metric_key_2": { "text": "..." }
  }
  ```
  where metric_key is defined in `lib/logging/metric-key.ts`

#### `onboarding_responses`
```sql
id (uuid, PK)
user_id (uuid, FK → auth.users, NOT NULL)
quiz_answers (jsonb, default {})
custom_activities (jsonb, default {})
custom_metrics (jsonb, default {})
enabled_library_metrics (jsonb, default [])
completed_at (timestamptz)
```
- **Purpose:** Onboarding state — stores user's answers to the quiz, custom activities/metrics, and which library metrics they choose to track
- **RLS:** Users can only read/write/update/delete their own rows

---

## File Structure

```
.
├── app/                                # Next.js App Router
│   ├── globals.css                     # Global Tailwind styles
│   ├── layout.tsx                      # Root layout (AuthProvider wrapper)
│   ├── page.tsx                        # Home page (Supabase client test)
│   ├── middleware.ts                   # Auth session refresh middleware
│   ├── login/
│   │   ├── page.tsx                    # Login page (form)
│   │   └── actions.ts                  # Server actions (signUp, signIn)
│   ├── onboarding/
│   │   ├── page.tsx                    # Onboarding entry point
│   │   └── actions.ts                  # Server actions (save onboarding choices)
│   ├── dashboard/
│   │   └── page.tsx                    # Main dashboard (post-onboarding)
│   ├── morning/
│   │   ├── page.tsx                    # Morning planning interface
│   │   └── actions.ts                  # Save daily_plans
│   ├── quick-log/
│   │   ├── page.tsx                    # Quick logging page
│   │   └── actions.ts                  # Create quick_logs, handle recovery gap logic
│   ├── evening/
│   │   ├── page.tsx                    # Evening reflection interface
│   │   └── actions.ts                  # Save evening_reflections
│   ├── history/
│   │   └── page.tsx                    # View past logs and weekly summaries
│   ├── settings/
│   │   ├── page.tsx                    # Settings entry point
│   │   ├── actions.ts                  # Update metrics, activities, etc.
│   │   └── settings-client.tsx         # Settings UI (client component)
│
├── components/                         # Reusable React components
│   ├── ui/                             # Headless, unstyled Radix UI wrappers
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── toggle.tsx
│   ├── logging/
│   │   ├── activity-selector.tsx       # Dropdown/selector to pick activity
│   │   ├── metric-input.tsx            # Input widget (varies by input_type)
│   │   ├── quick-log-fab.tsx           # Floating action button
│   │   ├── quick-log-widget.tsx        # Quick log modal/widget
│   │   ├── morning-plan-form.tsx       # Form to set daily objective + motivation
│   │   ├── evening-reflection-form.tsx # Form to reflect on selected metrics
│   │   ├── history-day-card.tsx        # Card showing logs for a single day
│   │   ├── history-filters.tsx         # Filter controls for history view
│   │   ├── recovery-gap-prompt.tsx     # Modal: is gap recovery or break?
│   │   └── activity-color.tsx          # Activity color palette utilities
│   ├── onboarding/
│   │   ├── onboarding-wizard.tsx       # Multi-step form controller
│   │   ├── quiz-step.tsx               # Quiz questions (problem patterns)
│   │   ├── activities-step.tsx         # Add custom activities
│   │   ├── customize-step.tsx          # Choose library metrics to track
│   │   ├── custom-metric-builder.tsx   # Create custom metric
│   │   └── results-step.tsx            # Summary of choices
│   ├── dashboard/
│   │   └── dashboard-content.tsx       # Main dashboard layout
│   └── history/
│       └── weekly-summary-card.tsx     # AI-generated weekly summary display
│
├── contexts/
│   └── auth-context.tsx                # React Context for auth (user, signOut)
│
├── lib/                                # Utility functions & configurations
│   ├── utils.ts                        # General utilities (cn, etc.)
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client initialization
│   │   ├── server.ts                   # Server-side Supabase client
│   │   └── middleware.ts               # Auth session refresh (middleware.ts)
│   ├── auth/
│   │   └── post-auth-redirect.ts       # Determine user's post-login redirect (onboarding vs dashboard)
│   ├── logging/
│   │   ├── activity-color.ts           # Color mappings for activities
│   │   ├── history.ts                  # Query/fetch logs, build history view
│   │   ├── metric-key.ts               # Function to generate unique keys for metrics
│   │   ├── queries.ts                  # Supabase queries (fetch metrics, activities, etc.)
│   │   ├── recovery.ts                 # Recovery gap logic (calc gap, determine ambiguous threshold)
│
├── types/
│   ├── domain.ts                       # Core domain types (ProblemPattern, LibraryMetric, ActivityDraft, etc.)
│   ├── logging.ts                      # Logging types (Activity, DailyPlan, QuickLog, EveningReflection, etc.)
│   └── database.ts                     # Placeholder for auto-generated Supabase types
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql     # Core schema + RLS policies
│   │   └── 0002_seed_patterns_and_metrics.sql  # Library data (12 patterns, 12 metrics)
│   └── functions/
│       └── weekly-summary/
│           ├── index.ts                # Edge Function: fetch logs, call Together AI, return summary
│           ├── grouping.ts             # Group logs by activity or pattern
│           ├── recovery-pairs.ts       # Match setback→resume pairs for recovery analysis
│           ├── together.ts             # Together AI API client
│           └── cors.ts                 # CORS header utilities
│
├── public/                             # Static assets
│
├── .env.local                          # Local environment secrets (gitignored)
├── .env.local.example                  # Template for .env.local
│
├── next.config.ts                      # Next.js configuration
├── tsconfig.json                       # TypeScript configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── postcss.config.mjs                  # PostCSS configuration
├── eslint.config.mjs                   # ESLint configuration
├── components.json                     # shadcn/ui component registry
│
├── middleware.ts                       # App Router middleware (session refresh)
├── next-env.d.ts                       # Auto-generated Next.js types
│
├── package.json                        # Dependencies & scripts
├── package-lock.json                   # Dependency lock file
├── README.md                           # Standard Next.js README
└── .gitignore                          # Git ignore rules
```

---

## Core Concepts

### Problem Patterns

The app is built around **12 psychological patterns** that block progress:

1. **Immediate-reward dependence** — Motivation drops when payoff is delayed
2. **Novelty/strategy switching** — Switching approaches when current one gets hard
3. **Outcome attachment** — Mood/progress tied entirely to single result
4. **Uncertainty spiraling** — Seeking reassurance instead of taking action
5. **Overanalysis instead of observation** — Building stories instead of collecting data
6. **Fear of self-evaluation** — Avoiding honest look at performance
7. **Outcome-based confidence** — Confidence rises/falls with last result
8. **Confusing effort with inefficiency** — Effort feels like a sign you're doing it wrong
9. **Planning as substitute for execution** — Over-planning while delaying action
10. **Future-load** — Attention on everything left to do vs. current step
11. **Difficulty tolerating the boring middle** — Long repetitive stretch feels unmanageable
12. **Trying to control uncontrollable variables** — Energy on uncontrollable outcomes

### Metrics Library

Each pattern has **at least one associated metric**—a concrete, trackable thing users can log to make the pattern visible:

- **Tally Metrics** — User taps counter (e.g., "How many times did I switch strategy today?")
- **Number Metrics** — User enters a number (e.g., "Mood rating 1-5")
- **Text Metrics** — User writes a note (e.g., "What actually happened vs. what I guessed")
- **Timer Metrics** — User marks start/stop to measure duration (e.g., "Time from setback to resuming")

### Onboarding Phases

1. **Quiz** — User answers questions about their problem patterns
2. **Activities** — User defines 3-5 life domains to track (work, health, relationships, etc.)
3. **Customize** — User chooses which library metrics to track for each pattern
4. **Results** — Summary of user's choices; option to add custom metrics

### Daily Rhythm

```
Morning:      User sets objective + motivation for each activity
Throughout:   User taps/logs quick metrics (quick-log widget)
Evening:      User reflects on selected metrics for the day
Weekly:       AI review generates insights from raw logs
```

### Metric Key

A **metric key** uniquely identifies a metric per activity. Used in evening reflections to link responses back to specific metrics and activities:

```typescript
// Example metric key format: "metric_id:activity_id"
"22222222-0000-0000-0000-000000000001:activity-gym"
```

---

## Key Features

### Phase 1: Scaffold (Current)
- ✅ Authentication (sign up, log in, session management)
- ✅ Onboarding wizard (multi-step form)
- ✅ Database schema + RLS policies
- ✅ Pre-seeded problem patterns & metrics library

### Phase 2–6: Planned Features

**Phase 2 — Morning Planning**
- Set daily objective + motivation per activity
- Visual activity dashboard

**Phase 3 — Quick Logging**
- Floating action button (FAB) to log metrics in real-time
- Support for all input types (tally, number, text, timer)
- Recovery-gap detection (setback → resume logic)

**Phase 4 — Evening Reflection**
- Prompt user to reflect on selected metrics for the day
- Store reflection responses with activity/metric linkage

**Phase 5 — History & Analysis**
- View past logs by day/week/activity
- Filter and drill down into patterns
- Display recovery-gap analysis

**Phase 6 — Weekly Summaries (AI)**
- Supabase Edge Function queries daily logs
- Calls Together AI to generate insights
- Displays AI summary on history page

---

## Authentication Flow

### Sign Up
1. User enters email + password on `/login`
2. `signUp` action calls `supabase.auth.signUp()`
3. Supabase sends confirmation email (or auto-confirms depending on config)
4. User redirected to onboarding or dashboard (via `post-auth-redirect`)
5. Trigger creates `profiles` row automatically

### Sign In
1. User enters email + password on `/login`
2. `signIn` action calls `supabase.auth.signInWithPassword()`
3. Session stored in browser localStorage
4. Middleware refreshes session token on every request
5. `AuthProvider` reads session from initial props, listens for auth state changes

### Session Refresh
- **Middleware** runs on every request; calls `updateSession(request)`
- **updateSession** checks token expiry and calls `supabase.auth.refreshSession()` if needed
- **Response cookie** sent back to browser with refreshed tokens
- **AuthContext** listens to `onAuthStateChange()` for cross-tab sync

### Sign Out
- `useAuth().signOut()` clears session
- Redirects to `/login`
- Router refresh ensures clean state

---

## Data Models

### Domain Types (`types/domain.ts`)

```typescript
type InputType = "number" | "text" | "timer" | "tally";

type ProblemPattern = {
  id: string;
  name: string;
  description: string;
};

type LibraryMetric = {
  id: string;
  name: string;
  description: string;
  why_it_helps: string;
  input_type: InputType;
  problem_pattern_id: string | null;
};

type CustomMetricDraft = {
  name: string;
  description: string;
  input_type: InputType;
};

type ActivityDraft = {
  name: string;
  description: string;
};

type QuizAnswer = {
  question_id: string;
  score: number; // 1-5
};
```

### Logging Types (`types/logging.ts`)

```typescript
type Activity = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

type ActiveUserMetric = {
  user_metric_id: string;
  metric_id: string | null;
  custom_metric_id: string | null;
  name: string;
  description: string;
  input_type: InputType;
  is_custom: boolean;
};

type DailyPlan = {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  activity_id: string;
  objective_text: string | null;
  motivation: number | null; // 0-10
  created_at: string;
};

type QuickLog = {
  id: string;
  user_id: string;
  timestamp: string;
  activity_id: string;
  metric_id: string | null;
  custom_metric_id: string | null;
  tag: "setback" | "resume" | null;
  content: string | null;
  value: number | null;
};

type EveningReflection = {
  id: string;
  user_id: string;
  entry_date: string;
  responses: Record<string, EveningReflectionResponse>;
  created_at: string;
};
```

---

## Environment Configuration

### Required Environment Variables

```env
# Supabase — get from project Settings > API page
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Together AI — server-side only (set as Supabase Edge Function secret in Phase 6)
# TOGETHER_API_KEY=your-api-key
```

### File Locations
- **Local secrets:** `.env.local` (gitignored)
- **Template:** `.env.local.example` (committed; shows required variables)
- **.gitignore rules:**
  ```
  node_modules
  .next
  .env
  .env.local
  .env.*.local
  ```

---

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Database Migrations
```bash
# Link to Supabase project
supabase link --project-id <ref>

# Push migrations to remote
supabase db push

# Pull latest schema as types
supabase gen types typescript --project-id <ref> > types/database.ts
```

### Deployment
```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel deploy
```

---

## Key Implementation Patterns

### Server Actions
- Defined in `actions.ts` files within page directories
- Use `"use server"` directive
- Called directly from client components or forms
- Handle Supabase mutations (insert, update, delete)
- Return results or errors to client

### Client Components
- Use `"use client"` directive for interactivity
- Access user/auth via `useAuth()` hook
- Real-time state via React `useState()`
- Call server actions for mutations

### Server Components
- Default in Next.js 16; no directive needed
- Fetch data at build/request time
- Pass props to client components
- Never expose secrets

### Row-Level Security (RLS)
- Every user table has RLS policies
- Policies check `auth.uid() = user_id`
- Library tables (patterns, metrics) have public read-only access
- Enforced at database layer; bypasses cannot occur from browser

---

## Notes & Gotchas

1. **Metric Key Generation** — `metric-key.ts` creates unique identifiers for metrics per activity; used in evening reflections to link responses back to the correct metric/activity pair

2. **Recovery Gap Logic** — When a user logs "resume" after "setback", the system calculates the gap. If gap exceeds a threshold (e.g., 24 hours), it prompts user to confirm: is this gap "recovering" (learning from the setback) or "break" (unrelated downtime)?

3. **Onboarding State Persistence** — Onboarding responses are stored in `onboarding_responses` table so users can return to onboarding if needed; `completed_at` timestamp indicates whether user finished

4. **Quiz Scoring** — Quiz answers include a score (1-5); used in onboarding to identify user's top problem patterns and suggest metrics

5. **Activity Colors** — Each activity gets a color for visual distinction across the UI; mappings in `lib/logging/activity-color.ts`

6. **Weekly Summary Edge Function** — Deployed to Supabase; queries user's logs, groups by activity/pattern, calls Together AI to generate insights; returns summary markdown/text

---

## Future Considerations

- Multi-language support
- Mobile app (React Native?)
- Sharing reports with coaches/therapists
- Integration with calendar (Google Calendar, Outlook)
- Advanced charting & data viz
- Habit streaks & gamification
- API for third-party integrations

---

**Document Version:** 1.0  
**Last Updated:** 2026-08-15  
**Maintainer:** Process Journal Team
