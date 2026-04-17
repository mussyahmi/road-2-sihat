# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (type-checks + static generation)
npm run lint     # ESLint
```

## Firebase Setup

Fill in `.env.local` before running — the app won't work without real credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase Firestore structure: `users/{userId}/measurements/{measurementId}` — each document is a `Measurement` object (see `src/lib/types.ts`).

Enable **Google Sign-In** in Firebase Console → Authentication → Sign-in providers, and add `localhost` to Authorized Domains.

## Architecture

```
src/
  app/
    (auth)/signin/    # Public sign-in page (Google only)
    (app)/            # Protected route group — redirects to /signin if unauthenticated
      layout.tsx      # Auth guard
      dashboard/      # Main view: overview chart, per-metric charts, history table
      add/            # Manual data entry form
      edit/           # Edit/delete an existing entry — receives ?id= query param
    layout.tsx        # Root layout — wraps everything in <Providers>
    page.tsx          # Redirects to /dashboard or /signin based on auth state
  components/
    charts/           # Recharts-based components: WeightOverviewChart, MetricLineChart
    providers.tsx     # ThemeProvider (next-themes) + AuthProvider composed together
    navbar.tsx        # Sticky top nav with Add Entry button and user dropdown
    theme-toggle.tsx  # Dark/light toggle using useTheme()
    latest-stats.tsx  # Grid of metric cards with delta badges vs previous measurement
  contexts/
    auth-context.tsx  # Firebase auth state, signInWithGoogle, signOutUser
  lib/
    firebase.ts       # Firebase init (lazy, client-only via typeof window guard)
    firestore.ts      # CRUD: addMeasurement, getMeasurements, updateMeasurement, deleteMeasurement
    types.ts          # Measurement interface + METRIC_CONFIGS array + STATUS_COLORS
scripts/
  seed-measurements.mjs  # Dev-only seed script using Admin SDK (requires serviceAccount.json)
```

## Key Conventions

**shadcn/ui version**: This project uses the new `@base-ui/react` based shadcn — the `Button` component does **not** support `asChild`. Use `buttonVariants()` with `<Link>` instead:
```tsx
import { buttonVariants } from "@/components/ui/button";
<Link href="/foo" className={buttonVariants({ variant: "default" })}>Go</Link>
```

**Theme toggle**: Always use `const { resolvedTheme, setTheme } = useTheme()` from `next-themes`. `resolvedTheme` (not `theme`) handles the `"system"` default correctly.

**Firebase on server**: `auth` and `db` are guarded with `typeof window !== "undefined"`. Never import them in server components — only in `"use client"` files. (`storage` is exported but currently unused in the app.)

**Adding new metrics**: Add to `METRIC_CONFIGS` in `src/lib/types.ts` and the `FIELDS` array in **both** `src/app/(app)/add/page.tsx` and `src/app/(app)/edit/page.tsx`. The dashboard charts auto-render all entries in `METRIC_CONFIGS`.

**Data model**: 18 numeric fields from the body composition scale are stored per entry (see `Measurement` in `types.ts`), plus an optional `notes?: string` free-text field. `height` is stored as a field but is intentionally absent from `METRIC_CONFIGS` (not charted). The `date` field is a full ISO string (`"2026-04-17T07:11:00"`).
