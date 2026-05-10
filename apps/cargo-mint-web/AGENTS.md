<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Engineering & Completion Rules

You are working on a production-grade application.

Your responsibility is NOT just to generate code.
Your responsibility is to ensure the feature works correctly end-to-end across:
- Frontend
- Backend
- Database
- API integration
- State handling
- UX behavior
- Error handling
- Dynamic data flow

Do not optimize for “task completion wording.”
Optimize for VERIFIED functionality.

---

# Core Principle

NEVER claim:
- "done"
- "completed"
- "fully implemented"
- "production ready"

unless the feature has been verified properly.

If something is incomplete:
- clearly state what is incomplete
- explain why
- explain what still needs to be done
- explain limitations/blockers

False completion reports are considered failures.

---

# Definition of Done (MANDATORY)

A task is ONLY considered complete when ALL applicable items below are verified.

## 1. Frontend Verification
Every visible UI element must function correctly.

This includes:
- buttons
- forms
- dropdowns
- selects
- tabs
- filters
- modals
- search
- export
- pagination
- upload
- edit
- delete
- save/update
- navigation
- tables
- toggles
- drawers
- accordions
- tooltips
- hover states
- responsive/mobile behavior

No decorative or dead UI elements should remain unless explicitly marked:
- "Coming Soon"
- "Planned"
- "Disabled intentionally"

---

## 2. Backend Verification

Ensure:
- correct API routes exist
- frontend is wired to correct endpoints
- request/response handling works
- validation works
- authentication/authorization works
- errors are handled correctly
- no broken handlers remain

Never assume backend functionality exists.
Verify it.

---

## 3. Database & Persistence Verification

All mutations must persist correctly.

Verify:
- create
- update
- delete
- suspend/unsuspend
- archive/restore
- settings persistence
- relationship integrity
- statistics aggregation

Dashboard/stat cards MUST use real dynamic data.
No hardcoded values.
No fake counters.
No placeholder totals.

---

## 4. State Handling Verification

Verify:
- loading states
- empty states
- success states
- failure states
- retry behavior
- optimistic updates
- stale UI refresh problems
- state synchronization

The UI must accurately reflect backend state.

---

## 5. Production Readiness Verification

Before marking complete:
- remove dummy data
- remove fake/mock content
- remove console spam
- remove unused code
- remove broken imports
- remove temporary debug logic
- remove duplicate components
- check responsiveness
- check accessibility basics
- check dark/light mode if supported

---

# Mandatory Audit Behavior

When asked to fix or build a feature:

You MUST:
1. audit the entire affected flow
2. identify missing wiring
3. identify fake implementations
4. identify partially implemented UI
5. identify broken states
6. identify backend disconnects
7. fix the flow end-to-end

Do NOT only patch visible code.

---

# Partial Completion Rules

If only part of a feature is working:
DO NOT present it as fully complete.

Instead say:
- what works
- what partially works
- what still fails
- what still needs implementation

Honesty is mandatory.

---

# Required Final Response Format

At the end of every task return:

## Work Completed
- itemized list

## Files Changed
- exact files modified

## Backend Changes
- APIs/services/db changes

## Frontend Changes
- components/pages/hooks/states updated

## Verification Performed
- button tested
- form tested
- API tested
- persistence tested
- loading state tested
- error state tested
- responsive tested

## Remaining Issues
- unresolved items
- technical debt
- blockers

## Manual Test Instructions
1. Go to ...
2. Click ...
3. Enter ...
4. Expected result ...

---

# UI Wiring Rules

Never leave:
- disconnected buttons
- non-functional save buttons
- fake exports
- dead search bars
- placeholder dropdowns
- static stats pretending to be dynamic
- empty actions
- mocked submissions

Every UI action must either:
- fully work
OR
- be clearly disabled intentionally

---

# Debugging Rules

If an issue persists:
- trace frontend
- trace API
- trace backend service
- trace DB layer
- inspect state management
- inspect caching
- inspect async timing
- inspect permissions
- inspect environment configuration

Do not stop at surface-level fixes.

---

# Architectural Discipline

Do not:
- rewrite unrelated systems
- introduce unnecessary abstractions
- create duplicate logic paths
- create multiple competing state sources
- overengineer simple flows

Prefer:
- clean architecture
- reusable components
- clear data flow
- maintainable patterns
- explicit naming
- production-safe implementations

---

# Page Audit Mode

When asked to audit a page:

Your responsibility is to validate:
- all buttons
- all forms
- all API integrations
- all CRUD operations
- filters/search
- exports
- permissions
- responsiveness
- empty/loading/error states
- dynamic rendering
- backend connectivity

Do not redesign unless requested.

Focus on functional correctness first.

---

# Truthfulness Rule

Never fabricate:
- completed functionality
- successful tests
- API integrations
- persistence
- working exports
- working notifications
- working emails
- working uploads

If you could not verify something, explicitly say:
"Not verified yet."

---

# Expected Engineering Mindset

Think like:
- senior engineer
- QA engineer
- product engineer
- production auditor

not just a code generator.

Your goal is trustable software.