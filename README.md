<img src="public/grindsheetLogo.png" alt="GrindSheet logo" width="92" />

# GrindSheet

**A workout-tracking progressive web app focused on quick logging, visible progress, and friendly competition.**

GrindSheet began as a React/TypeScript web app. This repository contains that **web/PWA implementation**; the later native SwiftUI/HealthKit version is a separate project and is not included here.

## Features

- **Workout history:** Record exercises and review past activity.
- **Progress dashboard:** Track performance over time with charts, category filters, and multiple date ranges.
- **Personal records:** Explore PRs and exercise-specific progress.
- **Social features:** Compare records and take part in tournament-style views.
- **Account-backed data:** Authentication and workout data are integrated with Supabase.
- **Installable web experience:** PWA manifest and service-worker setup via `vite-plugin-pwa`.

## Built with

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, and React Query  
**Data & authentication:** Supabase  
**PWA:** `vite-plugin-pwa`

The application routes live in [`src/App.tsx`](src/App.tsx). Key views include [Dashboard](src/pages/Dashboard.tsx), [History](src/pages/History.tsx), [Exercise Detail](src/pages/ExerciseDetail.tsx), [Personal Records](src/pages/PRRecords.tsx), and [Tournament](src/pages/Tournament.tsx).

## Run locally

Requires a recent Node.js release and npm.

```bash
git clone https://github.com/vp-27/GrindSheet.git
cd GrindSheet
npm ci
npm run dev
```

Vite is configured to serve the app on **http://localhost:8080**. Other available commands:

```bash
npm run build   # production bundle
npm run lint    # ESLint
npm run preview # preview a built bundle
```

**Backend caveat:** This is not a fully self-contained offline demo. The Supabase client is configured in [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts), and features such as sign-in and synced workout data depend on a working Supabase project, its database schema, and appropriate access policies. A fresh clone alone does not provision that backend. Do not use sensitive real-world data when testing an unverified deployment.

## Project evolution

I later reworked GrindSheet as a **native iOS app in SwiftUI**, with HealthKit integration and a different implementation. This repository remains available to show the original browser/PWA architecture and interface work.

## Repository scope

This is a personal project shared for code review and demonstration. No claim is made that a fresh clone has been end-to-end tested against a newly provisioned Supabase backend.
