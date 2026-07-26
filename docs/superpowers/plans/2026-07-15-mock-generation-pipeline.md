# Mock Generation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the create flow from draft-only to a mock generation job with polling status and preview results.

**Architecture:** Add deterministic local job progress logic in `src/lib/generation-job.ts`, API routes for job creation and status, and a client result page that polls the status route. Generated images are mock CSS tiles for now; Fal.ai/R2/Supabase will replace this later.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, Vitest.

## Global Constraints

- Do not call real AI providers in this module.
- Do not store uploaded files in this module.
- Preserve 1-6 selfie validation.
- Keep API response shapes close to future provider-backed implementation.
- Finish with `npm test`, `npm run lint`, and `npm run build`.

---

### Task 1: Job Domain

**Files:**
- Create: `src/lib/generation-job.ts`
- Create: `src/lib/generation-job.test.ts`

**Interfaces:**
- `createMockGenerationJob(input: DraftInput): GenerationJob`
- `getMockJobSnapshot(job: GenerationJob, now?: number): GenerationJob`

- [ ] Write tests for queued, processing, and completed status transitions.
- [ ] Implement job creation and deterministic mock result images.
- [ ] Run tests.

### Task 2: API Routes

**Files:**
- Create: `src/app/api/generate/jobs/route.ts`
- Create: `src/app/api/generate/jobs/[id]/route.ts`

**Interfaces:**
- `POST /api/generate/jobs` validates draft input and returns `{ job, redirectUrl }`.
- `GET /api/generate/jobs/[id]` returns a mock job snapshot by encoded job ID.

- [ ] Add create-job API.
- [ ] Add status API.

### Task 3: Result UI

**Files:**
- Create: `src/components/generate/generation-progress.tsx`
- Create: `src/components/generate/result-gallery.tsx`
- Modify: `src/app/(dashboard)/generations/[id]/page.tsx`
- Modify: `src/app/(dashboard)/create/page.tsx`

**Interfaces:**
- Result page polls `/api/generate/jobs/[id]`.
- Create page submits to `/api/generate/jobs`.

- [ ] Build polling progress component.
- [ ] Build mock result gallery.
- [ ] Replace draft page with client polling page.
- [ ] Point create submit at job API.

### Task 4: Verification

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

## Self-Review

- This module creates an end-to-end mock generation flow while deliberately deferring real provider/storage/database integration.
