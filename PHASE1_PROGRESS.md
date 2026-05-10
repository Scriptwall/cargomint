# CargoMint Phase 1 Progress Tracker

Last updated: 2026-04-28 (session 17)

This file is the running implementation log so we keep building forward without resetting context each session.

## 1) Foundation
- [x] 4-project solution structure in place (`Domain`, `Application`, `Infrastructure`, `Api`)
- [x] MediatR + FluentValidation pipeline wired
- [x] EF Core DbContext + migrations baseline created
- [x] Global exception middleware in API
- [x] Tenant-aware query filtering (`IMustHaveTenant`) in DbContext
- [x] Tenant resolution fallback chain: JWT claim -> `X-Tenant-Id` header -> `tenantId` query param
- [x] Typed configuration wiring for JWT, CORS, Hangfire, and external gateway clients
- [x] Structured request logging and correlation id middleware
- [x] Centralized authorization policies by actor/role matrix

## 2) Super Admin (Master Console)
- [x] Tenant onboarding command/query endpoints
- [x] Countries/regions/states CRUD entry points
- [x] Platform dashboard + tenant list endpoints
- [x] Immutable audit export endpoint (CSV)
- [x] Tenant suspend/reactivate workflows
- [x] Service Centre staff management backend

## 3) Logistics Tenant (Operations Dashboard)
- [x] Shipment desk create/read flows (core)
- [x] Manifest create/dispatch flows (core)
- [x] Fleet registration and captain entities/flows (baseline)
- [x] Pricing quote calculation handler
- [x] SLA risk indicators + dashboard aggregation completeness
- [x] Role-permission matrix enforcement (`TenantAdmin`, `HubManager`, `DeskOperator`, `FinanceUser`)

## 4) Merchant Portal (Phase 1)
- [x] Wallet balance and credit baseline
- [x] COD/invoice entity and accounting baseline
- [x] Bulk upload pipeline (`.xlsx`/`.csv` up to 10,000 rows) with row-level validation
- [x] Contract rate-card management UX/API hardening
- [x] API keys + webhook management completion

## 5) Consumer App (Phase 1)
- [x] Tracking endpoint by waybill
- [x] Public pricing quote endpoint (`GET /api/v1/pricing/public-quote`)
- [x] 3-step booking wizard API contract finalization
- [x] Public quote response aligned to PRD itemized contract
- [x] No-login tracking timeline format aligned to PRD milestones (`GET /api/v1/tracking/public/{waybill}`)

## 6) Captain App (Phase 1)
- [x] Scan/status update command baseline
- [x] OTP + signature + optional photo proof-of-delivery completion
- [x] Active trip route/stop sequence optimized response contract
- [x] Compliance flag dispatch-block policy enforcement

## 7) Phase 2 Guardrail (Do Not Build Yet)
- [x] Fleet tenant concepts exist in model
- [ ] Standalone fleet portal endpoints
- [ ] Auto-matching marketplace logic
- [ ] Partner fleet software API contract

## 8) Current Sprint Focus
1. Complete Phase 1 public flows (consumer quote/tracking shape + merchant bulk intake). [x]
2. Finish captain delivery proof chain (OTP, signature, photo) and COD remittance checkpoints. [x]
3. Refine multi-role portal experiences (Tenant Admin vs Master Admin). [x]
4. Scoped operational visibility for Hub/Service Centre staff. [x]

## 9) Session Notes (2026-04-27) - Current Session
- **Tenant Admin Experience**:
  - Built the missing **Tenant Admin Portal** (`/tenant-console`) for logistics owners to manage their specific instance.
  - Features: Dashboard, Staff Directory (with cross-tenant assignment), Network View, Fleet & Captains, Pricing Engine (Rate Matrix), and Audit Log.
  - White-label awareness: Topbar dynamically displays "Tenant Name | Role" instead of global titles.
- **Admin Console Hardening**:
  - Wired "Suspend/Reactivate" buttons to backend `PUT` endpoints.
  - Added "Tenant Details" modal with deep-dive stats (GMV, shipment counts, hub counts).
  - Added "Edit Tenant" modal for updating company info and plans.
- **Ops Dashboard Refinement**:
  - Restructured sidebar for better UX: `Shipments`, `Packaging`, `Manifesting`.
  - Implemented service-centre scoping: backend queries and dashboard now honor the `assignedServiceCentreId` claim.
  - Updated seeder to assign test operators to specific hubs for verification.
- **Manual Testing UX**:
  - Created `/accounts` helper page listing all seeded personas (Super Admin, Tenant Admin, Hub Operator, Merchant, etc.) with passwords and direct portal links.
  - Added "Need test accounts?" link to the main login screen.
- **Auth Scoping**:
  - Updated `AuthProvider` to correctly route `TenantAdmin` roles to the new console.
  - Verified `ITenantProvider` correctly extracts scoping claims for both `TenantId` and `ServiceCentreId`.

## 10) Next Steps
1. Hardening of the "Active Manifests" view in Ops Dashboard (currently just a list).
2. Integration of "Wallet/Ledger" actions for Tenant Admin.
3. Tenant settings policy validation pass (branding URL rules + audit signal checks).

## 11) Session Notes (2026-04-27) - Session 4
- **Tenant Admin Backend Activation**:
  - Replaced `TenantAdminFeatures` stub handlers with persisted implementations for:
    - Dashboard metrics (`GetTenantDashboardQuery`)
    - Staff listing + role resolution (`GetStaffQuery`)
    - Hub listing (`GetHubsQuery`)
    - Service centre listing (`GetServiceCentresQuery`)
    - Staff invite (`InviteStaffCommand`)
    - Staff suspend/restrict (`SuspendStaffCommand`, `RestrictStaffLoginCommand`)
    - Hub and service-centre create (`CreateHubCommand`, `CreateServiceCentreCommand`)
    - Staff to service-centre assignment (`AssignStaffToServiceCentreCommand`)
  - Added audit log writes for critical tenant-admin mutations.
- **Tenant Console UI Wiring**:
  - Kept strict template structure but moved key actions from placeholder to live API calls:
    - Invite staff modal now calls `POST /api/v1/TenantAdmin/staff/invite`
    - Create hub modal now calls `POST /api/v1/TenantAdmin/hubs`
    - Create service-centre modal now calls `POST /api/v1/TenantAdmin/service-centres`
    - Staff suspend button now calls `PUT /api/v1/TenantAdmin/staff/{id}/suspend`
  - Added live data hydration of template sections (dashboard/staff/hubs/service centres) via tenant-admin endpoints.
- **Verification**:
  - Frontend build (`apps/cargo-mint-web`) passes.
  - Backend (`CargoMint.Api`) builds cleanly after process unlock.

## 12) Session Notes (2026-04-27) - Session 5
- **Tenant Admin API Expansion**:
  - Added tenant-admin endpoints for:
    - Fleet list/create
    - Merchant list/create
    - Audit list
    - Tenant settings get/update
  - Extended tenant-admin feature handlers to persist these operations and emit audit records.
- **Tenant Console Wiring (Template-preserving)**:
  - Hydrates additional template sections from backend:
    - Fleet table
    - Merchant table
    - Audit log table
  - Wired remaining modal submits:
    - Register vehicle -> tenant-admin fleet endpoint
    - Onboard merchant -> tenant-admin merchant endpoint
  - Wired settings save hooks to tenant-admin settings update endpoint.
- **Build/Run Validation**:
  - Backend `dotnet build` passes.
  - Frontend `npm run build` passes.
  - Frontend dev server reachable on `:3000`; backend reachable on `:5234` (auth-protected endpoint returns 401 when unauthenticated).

## 13) Session Notes (2026-04-27) - Session 6
- **White-Label Runtime Theme Injection (Completed)**:
  - Extended tenant-admin settings API contract to include branding payload fields:
    - `brandColor`, `logoUrl`, `tagline` in get/update settings flow.
  - Persisted branding safely in tenant-scoped audit storage (`TenantBranding` / `SaveBranding`) without introducing cross-tenant leakage.
  - Kept profile update audit trace (`UpdateTenantSettings`) for operational observability.
- **Tenant Console Runtime Wiring**:
  - Added tenant settings hydration (`GET /api/v1/TenantAdmin/settings`) into the console bootstrap data load.
  - Applied tenant runtime CSS variable injection from API:
    - `--accent`
    - `--accent-hover` (derived shade)
  - Bound settings form fields to live API values and submit payload for:
    - Company name
    - Brand color
    - Logo URL
    - Tagline
  - Updated sidebar branding surface to reflect tenant identity (name/subdomain) and optional logo URL.
- **Validation / Verification**:
  - Backend `dotnet build CargoMint.sln` passes.
  - Frontend `npm run build` passes.

## 14) Session Notes (2026-04-27) - Session 7
- **Super Admin Console Hardening**:
  - Fixed global admin dashboard aggregates to be truly platform-wide (cross-tenant) by using `IgnoreQueryFilters` for retail user and captain counts.
  - Hardened GMV aggregation fallback (`0` on empty data) and switched admin UI fetches to `cache: no-store` for fresh metric rendering.
- **Tenant Management Reliability**:
  - Implemented real tenant CSV export from live tenant list data (no placeholder toast).
  - Removed duplicate New Tenant action from tenant page header (topbar remains canonical action).
  - Enriched tenant detail payload with operational stats and contact fields:
    - shipments, GMV, hubs/service centres, active fleet
    - admin email, admin phone, notes
  - Updated tenant detail modal formatting to explicit `Label: Value` rows for readability.
- **Tenant Onboarding Auth Path**:
  - `CreateTenant` now provisions a tenant-admin identity account and assigns `TenantAdmin` role.
  - API returns one-time temporary password for immediate first login testing.
  - Tenant onboarding metadata (country/plan/admin contact/notes) is audit-backed and reused in admin views.
- **Audit and Settings Actions**:
  - Added `GET /api/v1/Admin/audit-log` and wired admin audit table to live backend records.
  - Wired audit export button to real backend CSV endpoint (`/api/v1/Admin/audit-log/export`).
  - Fixed tenant UI settings load UX:
    - settings page now also hydrates tenants
    - added quick tenant picker + auto-load first tenant when available
- **Fleet & Compliance UX Clarification**:
  - Prevented accidental tenant modal trigger from Fleet/Compliance topbar action.
  - Added explicit in-page context: Super Admin is oversight-only; onboarding remains tenant/ops owned.
- **Invitation UX Status**:
  - Marked invitation send/resend as explicit placeholder pending email provider wiring (SendGrid), replacing misleading success-only toasts.
- **Build/Run Validation**:
  - Backend `dotnet build CargoMint.sln` passes.
  - Frontend `npm run build` passes.
  - Dev endpoints confirmed reachable: web `:3000`, API `:5234`.

## 15) Session Notes (2026-04-27) - Session 8
- **Super Admin Finance Oversight Slice (Implemented)**:
  - Added platform-wide finance overview query with cross-tenant data visibility:
    - Tenant subscription billing
    - Per-shipment platform fee accumulation
    - Platform revenue ledger aggregate
    - Tenant settlement overview
    - COD exposure across tenants
    - Merchant and tenant wallet balances
    - Gateway transaction feed
    - Settlement status buckets (`failed`, `pending`, `blocked`, `completed`)
    - Finance risk flags
  - Added export endpoints:
    - Finance report CSV
    - Platform ledger CSV
  - Added governance action endpoints with mandatory `reasonCode`:
    - Block / Unblock wallet
    - Freeze / Release settlement
    - Suspend / Reactivate tenant billing access
    - Apply platform credit / adjustment
  - Ensured all finance governance actions are written to immutable audit trail (`FinanceControl`) with:
    - actor
    - action type
    - affected record
    - timestamp
    - reason code (+ note/amount payload)
- **Super Admin UI Integration**:
  - Added `Finance Oversight` page in Master Console navigation.
  - Wired live overview cards, tables, risk flags, governance action buttons, and CSV exports.
  - Governance buttons require reason code prompts before request dispatch.
- **Validation**:
  - Backend `dotnet build CargoMint.sln` passes.
  - Frontend `npm run build` passes.
  - API and web runtimes confirmed reachable after restart.

## 16) Session Notes (2026-04-27) - Session 9
- **Super Admin UX/State Fixes (Follow-up)**:
  - Moved `Finance Oversight` into its own `Finance` sidebar section (not nested under `Tenants`).
  - Added working topbar search state and page-aware filtering for:
    - tenant table
    - dashboard recent tenants
    - finance billing/wallet/transaction tables
    - audit log
- **Tenant Status & Dashboard Accuracy**:
  - Extended admin dashboard response `RecentTenants` to include `isActive`/`status`.
  - Replaced hardcoded `Active` badge on dashboard recent tenant cards with live status (`Active`/`Suspended`).
  - This ensures tenant suspension is reflected consistently in dashboard UI.
- **Tenant Edit Data Hydration**:
  - Changed edit flow to fetch full tenant details (`GET /api/v1/Admin/tenants/{id}`) before opening edit modal.
  - Ensures `adminEmail` and `adminPhone` fields populate from persisted backend values reliably.
- **Sidebar Identity Block**:
  - Updated sidebar footer identity stack to show:
    - role
    - name
    - email
- **Validation**:
  - Frontend `npm run build` passes.
  - Backend changed project `CargoMint.Application` builds cleanly.
  - Full solution build is currently blocked only by file-lock from running `CargoMint.Api` process (DLL in use).

## 17) Session Notes (2026-04-27) - Session 10
- **Admin Console Recovery (Critical Build Fix)**:
  - Resolved Next.js parse failure on `apps/cargo-mint-web/src/app/(admin)/admin-console/page.tsx` caused by invalid UTF-8 input.
  - Replaced corrupted file content with a clean UTF-8 `admin-console` page component.
  - Preserved key admin flows required for ongoing QA:
    - Dashboard stats + dynamic recent tenant status badge (`Active`/`Suspended`)
    - Tenant list with working search
    - Tenant suspend/reactivate action
    - Edit tenant flow now loads full tenant details first (email/phone populate from persisted data)
    - Finance oversight entry present under dedicated `Finance` sidebar section
    - Audit list search
    - Sidebar footer identity stack shows role, name, and email
- **Validation**:
  - Verified file encoding starts with UTF-8 text bytes (no UTF-16 BOM).
  - Frontend `npm run build` passes on Next.js 16.2.4.

## 18) Session Notes (2026-04-27) - Session 11
- **Admin Console UI Refit (Post-Recovery)**:
  - Rebuilt `apps/cargo-mint-web/src/app/(admin)/admin-console/page.tsx` as a full multi-section console after accidental simplification.
  - Restored broad interface structure with:
    - Dashboard
    - Tenant Management
    - Invitations
    - Fleet & Compliance
    - Finance Oversight
    - Global Settings
    - Countries & Regions
    - Audit Log
  - Restored modal surfaces:
    - Onboard Tenant
    - Edit Tenant
    - Tenant Details
  - Kept previously requested behavior in place:
    - Footer identity stack (Role, Name, Email)
    - Search filtering for dashboard/tenants/audit
    - Tenant suspend/reactivate refresh
    - Edit tenant preloads persisted email/phone via detail fetch
    - Finance nav isolated under dedicated Finance section
- **Encoding/Build Stability**:
  - Replaced corrupted non-UTF8/UTF16 content with clean UTF8 source.
  - Frontend `npm run build` passes.

## 19) Session Notes (2026-04-27) - Session 12
- **Admin Console Template-Strict SPA Rewire**:
  - Refined admin console to follow master-template visual structure and element patterns more strictly.
  - Restored template-style icon element structure in navigation and topbar (inline SVGs matching template patterns).
  - Restored tenant action control pattern to template style (`icon-btn` + SVG eye/edit/suspend).
  - Preserved SPA behavior with componentized architecture (no iframe):
    - Sidebar
    - Topbar
    - Dashboard view
    - Tenants view
    - Invitations view
    - Finance view
    - Settings view
    - Regions view
    - Audit view
  - Kept key rewires active while preserving template layout direction:
    - search filters
    - tenant suspend/reactivate refresh
    - tenant edit prefill from persisted details
    - finance exports/actions
    - audit export
    - footer Role / Name / Email
- **Validation**:
  - Frontend `npm run build` passes.

## 20) Session Notes (2026-04-27) - Session 13
- **Admin Console Template Parity Completion Pass**:
  - Converted admin console section headers and modal/form classes to template-native names (`sec-header/sec-title`, `modal-header/modal-title/modal-close`, `form-label/form-input`, `modal-footer`) while keeping the SPA component split.
  - Restored the missing dashboard slab under "Shipments by tenant" with a live "Status breakdown" row.
  - Aligned topbar search placeholder to template phrasing and kept primary topbar CTA fixed to `+ New Tenant` as in template.
  - Expanded create/edit tenant modal structure to match template fields and order:
    - company, subdomain, admin email, country, plan, admin phone, notes.
  - Kept all previously wired backend behaviors intact (tenant CRUD/edit/suspend, finance governance/actions, exports, audit wiring).
- **Validation**:
  - Frontend `npm run build` passes.

## 21) Session Notes (2026-04-28) - Session 14
- **Admin Console SPA Template Rewrite**:
  - Rewrote `apps/cargo-mint-web/src/app/(admin)/admin-console/page.tsx` into a template-first SPA that now follows the provided `cargomint-master-console.html` structure instead of the expanded custom admin variant.
  - Removed template drift from the admin shell by restoring:
    - light-first DM Sans / DM Mono visual language
    - original sidebar groups and page set
    - original topbar layout and CTA pattern
    - original dashboard, tenants, invitations, settings, regions, and audit page compositions
    - original new-tenant modal flow and toast behavior
  - Kept the admin UI componentized while matching the template:
    - `Sidebar.tsx`
    - `Topbar.tsx`
    - `DashboardView.tsx`
    - `TenantsView.tsx`
    - `InvitationsView.tsx`
    - `SettingsView.tsx`
    - `RegionsView.tsx`
    - `AuditView.tsx`
  - Scoped the template styling to the admin route so the rest of the web app is not forced onto the master-console palette.
  - Deliberately parked most backend dynamism for this route so the visual baseline can be approved first before reintroducing live data wiring.
- **Validation**:
  - Frontend `npm run build` passes.
  - Frontend `npm run lint` still fails, but only because of pre-existing issues in other app routes and shared files outside this rewrite.

## 22) Session Notes (2026-04-28) - Session 15
- **Super Admin Dynamic Wiring Pass**:
  - Rewired the template-based super admin SPA to live admin endpoints while preserving the existing master-console shell and component split.
  - Replaced static admin datasets with live API loading for:
    - dashboard metrics
    - tenant list
    - invitations
    - tenant UI settings
    - countries
    - audit log
    - finance oversight
    - fleet & compliance
  - Added page-specific topbar behavior so the template CTA only opens the correct modal for the active page:
    - `+ New Tenant` on dashboard/tenants/invitations
    - `+ Add Country` on countries & regions
    - no misplaced tenant CTA on finance/fleet/settings/audit
  - Removed the duplicate page-level tenant create button from the tenant table to keep the template clean.
  - Added dynamic sidebar footer identity stack from authenticated session:
    - role
    - name
    - email
  - Wired tenant management behaviors:
    - CSV export of filtered rows
    - persisted suspend/reactivate
    - detail modal with property/value card layout
    - edit modal prefilled from saved tenant detail including email and phone
    - create tenant flow showing generated temporary password/invite response
  - Wired invitation lifecycle surface:
    - live invitation rows
    - resend action
    - pending/accepted/expired state display
  - Wired tenant branding settings:
    - tenant selector
    - load/save branding fields from database-backed admin endpoints
  - Wired finance oversight page:
    - report export
    - ledger export
    - wallet block/unblock
    - billing suspend/reactivate
    - settlement freeze/release
    - platform credit/adjustment modal
  - Added a dedicated fleet & compliance page component using the new backend overview endpoint so it no longer routes into tenant creation behavior.
- **Backend Support Added/Completed**:
  - Added admin invitation query/resend endpoints.
  - Added admin tenant branding query/update endpoints.
  - Added global fleet/compliance overview endpoint.
  - Extended admin dashboard, tenant, and audit query DTOs with the additional fields required by the SPA.
  - Added first-login password change flow and `mustChangePassword` handling for tenant onboarding.
- **Validation**:
  - Frontend `npm run build` passes.
  - Super admin smoke test passes through proxy:
    - login returns token
    - `/api/v1/Admin/dashboard` responds
    - `/api/v1/Admin/tenants` responds
  - Full `dotnet build` is blocked at final copy step because the already-running `CargoMint.Api` process is locking output DLLs; the earlier compile error in tenant branding payload wiring was fixed.

## 23) Session Notes (2026-04-28) - Session 16
- **Super Admin Runtime Stabilization**:
  - Fixed a stale-backend issue where the running API process was serving older admin routes, which caused the dashboard stat row to disappear because the shared SPA bootstrap was failing on missing admin endpoints.
  - Restarted the API on the updated build and revalidated all super-admin route dependencies.
  - Fixed admin finance overview runtime failures by moving non-translatable LINQ work out of EF projections and out of `CountAsync` predicates.
  - Fixed tenant detail and tenant list readback after create/update:
    - identified that super-admin tenant audit records were being stored with `TenantId = 0`
    - switched tenant metadata/invitation/settings readers to resolve tenant identity from `EntityId`
    - replaced fragile generic JSON deserialization with explicit `JsonDocument` parsing for admin metadata payloads
  - Verified tenant UI settings load/save path on live admin endpoints.
  - Verified export endpoints for audit and finance reports.
- **Validation**:
  - Frontend `npm run build` passes.
  - Backend `dotnet build CargoMint.Api` passes.
  - Live admin API checks now pass for:
    - dashboard
    - tenants
    - invitations
    - countries
    - audit log
    - finance overview
    - fleet compliance
  - Tenant create/update round-trip verified, including persisted:
    - email
    - phone
    - contact person
    - address
    - plan

## 24) Session Notes (2026-04-28) - Session 17
- **Super Admin UI Rebuild Baseline**:
  - Replaced the existing `/admin-console` super-admin page with a template-driven SPA shell modeled directly on the provided `cargomint-master-console-v2.html` sample.
  - Preserved the new master-console structure and visual language:
    - dark sidebar and topbar shell
    - finance parent nav with sub-navigation
    - dashboard, tenants, captains, invitations, geography, audit, and settings views
    - modal stack for tenant onboarding, suspension, wallet block, settlement freeze, credits, invitations, and geography
    - toast feedback pattern
  - Moved the rebuilt super-admin template into dedicated frontend files:
    - `apps/cargo-mint-web/src/app/(admin)/admin-console/page.tsx`
    - `apps/cargo-mint-web/src/app/(admin)/admin-console/template.css`
    - `apps/cargo-mint-web/src/app/(admin)/admin-console/template-pages.ts`
- **Validation**:
  - Targeted ESLint passes for the new admin-console files.
  - TypeScript compile passes for the web app (`tsc --noEmit`).
  - Full `next build` remains blocked by the existing app-wide `next/font/google` dependency because this session cannot reach Google Fonts.

## 25) Session Notes (2026-04-29) - Session 18
- **Geography UX fixes (super admin)**:
  - Updated region creation flow so when a new region is created with states, the new region is auto-focused after reload and its states show immediately in the selected-region states panel.
  - Improved clarity in the region modal by explicitly scoping region/state viewing to the selected country and showing region state counts in the selector.
- **Tenant settings visibility wording**:
  - Renamed tenant portal sidebar label from `Tenant Settings` to `Global Settings` to align with user expectation for where workspace-wide settings live.
- **Shipment onboarding behavior (ops desk)**:
  - Extended shipment create payload to include sender details and sender type.
  - Added sender lookup UX in ops shipment modal: entering sender name/phone can auto-prefill from known retail customers.
  - Removed hardcoded shipment customer code usage in ops payload.
  - Implemented backend shipment customer resolution:
    - if sender exists, shipment uses existing customer/merchant code
    - if sender is new, system auto-creates an `IndividualCustomer` or `Company` and uses the generated code
  - This enables desk-based first-time onboarding and repeat sender matching in one flow.
- **Validation**:
  - `dotnet build CargoMint.sln` compile reached API copy stage; failed only because an already running `CargoMint.Api` process locked output DLLs (`CargoMint.Api (18732)`), not due to the new feature changes.

## 26) Session Notes (2026-04-29) - Session 19
- **Consumer Portal Implementation (Template-Adherent)**:
  - Rebuilt `/consumer-portal` with strict adherence to the consumer template shell and navigation flow (`Home`, `My Shipments`, `Wallet`, `Addresses`) while keeping it as a Next.js SPA route.
  - Preserved template-style layout hierarchy:
    - sidebar identity block
    - topbar search + `+ Send Package` action
    - card/table surfaces
    - toast pattern
    - modal pattern for booking flow
- **Consumer API Wiring (End-to-End Booking + Tracking)**:
  - Wired booking step 1 initiation to `POST /api/v1/consumer/bookings/initiate`.
  - Wired booking step 2 quote retrieval to `GET /api/v1/consumer/bookings/{sessionId}/quote`.
  - Wired booking step 3 confirmation to `POST /api/v1/consumer/bookings/confirm`.
  - Wired public waybill tracking to `GET /api/v1/Tracking/public/{waybill}` with milestone timeline rendering.
  - Added shipment list hydration from confirmed booking results in-session so users immediately see created waybills.
- **Consumer Scope Clarifications in UI**:
  - Documented wallet/address limitations in the UI where backend consumer-scoped endpoints are not yet exposed (wallet endpoints currently finance-policy protected).
- **Validation**:
  - Frontend production build passes: `npm run build` in `apps/cargo-mint-web`.

## 27) Session Notes (2026-04-29) - Session 20
- **Captain App Dynamism (Template-Adherent):**
  - Converted static captain template UI into state-driven flows while preserving the existing template layout and styling structure in pps/cargo-mint-captain/App.tsx.
  - Added dynamic manifest state with computed totals/progress (	otal, done, pending) reflected live on Trip and Profile sections.
  - Implemented manual scan behavior to select active waybill, status transitions (Arrived Hub, Loaded, In Transit, Out for Delivery, Delivered, Failed), and automatic recent-scan log updates.
  - Implemented delivery gating rules: OTP length check, signature capture requirement, proof photo counter, and confirm/fail actions that mutate shipment state.
  - Wired fuel logging input and toast feedback to state instead of static placeholders.
- **Dependency/Validation:**
  - Added missing direct dependency @expo/vector-icons to the captain app package metadata.
  - TypeScript validation passes for captain app: 
px tsc --noEmit in pps/cargo-mint-captain.

## 28) Session Notes (2026-04-29) - Session 21
- **Platform Subscription Foundation (Portal-Wide) Implemented:**
  - Added robust subscription domain model:
    - `SubscriptionPlanCatalog`
    - `SubscriptionPlatformSetting`
    - `TenantSubscription`
    - `SubscriptionInvoice` and `SubscriptionInvoiceLine`
    - `SubscriptionEventLog`
    - `ProcessedWebhookEvent` (idempotency)
  - Added subscription enums for billing cycle, subscription lifecycle, invoice status, and invoice line types.
  - Wired EF sets/configurations into `ICargoMintDbContext` and `CargoMintDbContext`.
  - Added startup-safe SQL table bootstrap for subscription tables (for environments without EF migration files).
- **Admin and Tenant Subscription APIs:**
  - Added super-admin subscription controller:
    - plans CRUD-lite upsert
    - global subscription settings management
    - tenant subscription lifecycle controls (activate/pause/resume/cancel/trial extension)
    - tenant subscription list endpoint
  - Added tenant subscription controller:
    - get own subscription
    - list subscription invoices
    - set payment method metadata
- **Trial, Billing, Dunning Automation:**
  - Added `SubscriptionBillingJobHandler` with:
    - trial-expiry transition logic
    - recurring billing cycle invoice generation (base + per-shipment fees)
    - dunning retries and auto-suspension when retries are exceeded
  - Registered Hangfire recurring jobs for trial expiry, billing cycle, and dunning.
- **Finance/Webhook Integration:**
  - Extended finance overview billing rows to use real subscription records where present.
  - Added webhook idempotency handling using `ProcessedWebhookEvents`.
  - Added webhook subscription invoice reconciliation path to mark invoices paid and reactivate subscription access.
- **Tenant Onboarding Integration:**
  - Tenant creation now auto-provisions a subscription record (trial-enabled by settings).
- **Stability Fixes after DB Reset:**
  - Hardened demo shipment seeding to avoid failures when service centres are absent after clean database wipe.
- **Validation:**
  - `dotnet build CargoMint.Api/CargoMint.Api.csproj` passes with 0 errors.
  - Runtime smoke check confirms subscription plan/settings endpoints return seeded defaults (3 plans, 14-day trial setting).

## 29) Session Notes (2026-04-29) - Session 22
- **Tenant Console Usability and Setup Flow Hardening:**
  - Updated tenant identity presentation in the tenant console sidebar:
    - Removed repeated "Tenant" wording from top-left identity text.
    - Top-left now shows company name with a clean `Admin` sublabel.
    - Plan display now renders dynamically as `<Plan> Plan` instead of showing tenant identifier/subdomain.
  - Fixed missing dynamic plan propagation:
    - Tenant settings state now correctly captures the plan value returned by tenant settings API.
- **Staff Management Fix (Service Centre Assignment):**
  - Extended `InviteStaffCommand` to accept optional `ServiceCentreId`.
  - Updated invite handler to persist assigned service centre on invited users.
  - Updated tenant console invite modal to send the selected service centre id in API payload.
- **Hub/Service Centre Creation Reliability:**
  - Hardened hub and service-centre creation by reading fallback stations with `IgnoreQueryFilters()`.
  - This avoids false creation failures in tenant-scoped contexts where station rows are filtered out.
- **Validation:**
  - `dotnet build CargoMint.sln` reached compilation but failed at copy stage because an active `CargoMint.Api` process locked output DLLs.
  - `npm run lint` reports pre-existing workspace lint violations outside this patch scope; no new lint gate was introduced for these targeted changes.

## 30) Session Notes (2026-04-29) - Session 23
- **Tenant Admin Hubs/Service Centres Reliability Pass:**
  - Added real update APIs for tenant hubs and service centres:
    - `PUT /api/v1/TenantAdmin/hubs/{id}`
    - `PUT /api/v1/TenantAdmin/service-centres/{id}`
  - Added corresponding application commands/handlers:
    - `UpdateHubCommand`
    - `UpdateServiceCentreCommand`
  - Wired tenant console edit actions to real API calls (replaced toast-only placeholders):
    - Hub "Edit hub" now opens modal in edit mode and persists updates.
    - Service centre "Edit" now opens modal in edit mode and persists updates.
  - Preserved create flows while sharing save handlers for create/edit mode in modals.
- **Validation:**
  - `dotnet build CargoMint.Application/CargoMint.Application.csproj` succeeds.
  - API project build still blocked by running `CargoMint.Api` process file locks during copy stage.

## 31) Session Notes (2026-04-29) - Session 24
- **Tenant Context Hardening (Long-term Stability):**
  - Hardened `TenantProvider` resolution to prevent invalid tenant context usage:
    - Tenant IDs from claims/header/query are now accepted only when `> 0`.
    - Added fallback resolution from authenticated user record (`ClaimTypes.NameIdentifier` -> user lookup) when request claims/header/query do not provide tenant id.
  - Added tenant-admin login safety guard:
    - `TenantAdmin` users with `TenantId <= 0` are blocked at login with a clear error to avoid running tenant operations in invalid/global scope.
- **Seeder Alignment for Tenant Admin Workspace:**
  - Added/ensured a real demo tenant: `Starship NG` (`identifier: starship-ng`).
  - Tenant admin seed account (`tenantadmin@swiftlog.com`) is now assigned to this tenant, including existing-account repair path during reseed.
- **Validation:**
  - `dotnet build CargoMint.Infrastructure/CargoMint.Infrastructure.csproj` succeeds.
  - API build remains blocked at copy stage due running `CargoMint.Api` process locking output DLLs.

## 32) Session Notes (2026-04-29) - Session 25
- **Tenant Subscription/Billing Flow Completion (Tenant Admin Portal):**
  - Fixed tenant creation plan assignment safety:
    - When a plan is provided, creation no longer silently falls back to Free Trial on lookup mismatch.
    - Plan resolution now supports tolerant matching (name/code/tokenized input and numeric amount extraction like `75000`).
    - Unknown plans now fail fast with explicit validation error.
  - Added tenant self-service subscription payment initialization endpoint:
    - `POST /api/v1/tenant/subscription/pay`
    - Resolves current due/failed invoice, or creates one from active plan base fee when absent.
    - Initializes payment gateway transaction and returns authorization URL.
    - Persists gateway reference and subscription payment-init audit event.
  - Upgraded tenant console billing UX (Settings page):
    - Added live "Subscription billing" card with plan, status, amount due, due date.
    - Added working "Pay current invoice" action that opens gateway authorization URL.
    - Wired tenant console to load subscription and invoice data from:
      - `GET /api/v1/tenant/subscription`
      - `GET /api/v1/tenant/subscription/invoices`
  - Improved gateway initialization behavior:
    - Paystack/Flutterwave integration now parses real authorization links from provider API response payloads instead of placeholder URLs.
- **Validation:**
  - `dotnet build CargoMint.Application/CargoMint.Application.csproj` succeeds.
  - `npm -C apps/cargo-mint-web run build` succeeds.
  - `dotnet build CargoMint.Api/CargoMint.Api.csproj` remains blocked in this environment by active `CargoMint.Api` process file locks during output copy.

## 33) Session Notes (2026-04-30) - Session 26
- **Tenant-Scoped Hub/Service-Centre Enforcement + Onboarding Tools:**
  - Enforced tenant-only hub/service-centre ownership in tenant admin workflows:
    - `GetHubs` and `GetServiceCentres` now return only current-tenant records.
    - `CreateHub` now requires tenant context and sets `ServiceCentre.TenantId` explicitly.
    - `CreateServiceCentre` now requires a valid tenant-owned hub and sets tenant ownership.
    - `UpdateHub`, `UpdateServiceCentre`, and `AssignStaffToServiceCentre` now enforce tenant scope.
  - Added tenant onboarding bulk import feature for hubs/service centres:
    - `POST /api/v1/TenantAdmin/import/hubs-service-centres`
    - Accepts rows of `HubName`, `ServiceCentreName`, optional `Location`.
    - Creates missing hubs and service centres for current tenant only.
  - Added tenant staff password-management endpoint (no SendGrid dependency):
    - `PUT /api/v1/TenantAdmin/staff/{id}/password`
    - Allows TenantAdmin to set/reset staff password and optionally force first-login password change.
- **Tenant Console UX Updates:**
  - Staff invite modal fields are now reliably reset on open/cancel/success.
  - Phone is split into `dial code` + `phone number` in tenant staff invite flow and persisted server-side.
  - Staff "Reset password" action now sets a temporary password via API directly.
  - Added Hubs page action `Import hubs/SCs` for fast tenant onboarding.
- **Service Centre Data Cleanup + Reseed:**
  - Executed one-time DB cleanup:
    - Cleared all service centres.
    - Cleared `AspNetUsers.AssignedServiceCentreId` values.
  - Updated seeding strategy:
    - Removed global/non-tenant default service-centre creation.
    - Kept tenant-owned demo structure creation logic for `starship-ng` tenant only.
- **Validation:**
  - `dotnet build CargoMint.Application/CargoMint.Application.csproj` succeeds.
  - `npm -C apps/cargo-mint-web run build` succeeds.
  - Backend restarted and confirmed listening on `http://localhost:5234`.

## 34) Session Notes (2026-04-30) - Session 27
- **Fleet Ownership Hardening + Import Onboarding:**
  - Enforced tenant ownership for fleet creation:
    - `RegisterFleet` now requires active tenant context.
    - Tenant must exist and be `Logistics` or `Fleet` operational type.
    - Registration numbers are normalized and validated for tenant-level uniqueness.
  - Added tenant operational type at domain/data level:
    - New enum `TenantOperationalType` (`Logistics`, `Fleet`).
    - Added `Tenant.OperationalType` with default `Logistics`.
    - Tenant creation now maps `CreateTenantCommand.Type` into persisted operational type.
  - Removed legacy global fleet assumptions:
    - Seeder no longer creates `TenantId = 0` fleets.
    - Added initializer cleanup routine to purge existing fleet data and detach fleet links from manifests.
  - Added bulk fleet import feature for fast onboarding:
    - `POST /api/v1/Logistics/fleet/import/preview`
    - `POST /api/v1/Logistics/fleet/import/confirm`
    - Supports row validation, duplicate detection in upload rows, skip-invalid processing, and batch responses.
- **Validation:**
  - `dotnet build CargoMint.sln` succeeds.
  - EF migration added: `EnforceTenantOwnedFleet`.

## 35) Session Notes (2026-04-30) - Session 28
- **Fleet Registration UX/Data Fixes (Tenant Console):**
  - Removed hardcoded captain names from vehicle registration modal.
  - Captain dropdown now resolves from real tenant staff records filtered by `Captain` role.
  - Added dependent vehicle selection:
    - `Make` dropdown
    - `Model` dropdown populated by selected make
    - Optional `Year` input
  - Fleet create payload now sends make/model/year summary in `description`.
- **Backend Fleet Hygiene (Tenant Admin path):**
  - Fleet listing now returns clean captain placeholder text (`Unassigned`) instead of malformed dummy text.
  - Tenant-admin fleet creation now requires tenant context and explicitly assigns `Fleet.TenantId`.
- **Validation:**
  - `dotnet build CargoMint.sln` succeeds.
  - `npm -C apps/cargo-mint-web run build` succeeds.

## 36) Session Notes (2026-04-30) - Session 29
- **Fleet Creation Failure Diagnostics + UX Hardening:**
  - Confirmed fleet creation is not service-centre dependent; service centre remains optional.
  - Added explicit tenant-admin fleet API failure messaging:
    - `POST /api/v1/TenantAdmin/fleet` now returns `400` with actionable reason when creation fails (e.g., missing tenant context, duplicate plate).
  - Hardened tenant-admin fleet create handler:
    - Requires valid tenant context.
    - Enforces tenant-scoped registration uniqueness before insert.
    - Explicitly sets `Fleet.TenantId`.
  - Improved tenant-console error visibility:
    - Fleet create now surfaces backend error details instead of a generic failure toast.
    - Shows a clear auth/permission message for `401/403`.
  - Fleet modal service-centre field now includes `Not selected` default option.
- **Validation:**
  - `dotnet build CargoMint.Api/CargoMint.Api.csproj` succeeds.
  - `npm -C apps/cargo-mint-web run build` succeeds.

## 37) Session Notes (2026-04-30) - Session 30
- **Tenant Staff + Hub/Service-Centre Test Readiness:**
  - Added tenant-admin invite password support end-to-end:
    - Invite modal now captures temporary password.
    - Invite API/handler now accepts `TemporaryPassword` and creates users through `UserManager.CreateAsync(...)`.
  - Replaced browser `window.prompt` for staff password reset with first-class modal UI.
  - Hardened topbar search input against browser autofill bleed:
    - Added explicit `name` + `autoComplete=\"off\"`.
    - Added autofill CSS override to prevent white-highlighted injected values in search field.
  - Backfilled tenant-owned location baseline in active DB:
    - Ensured each tenant has at least one hub and one service centre for onboarding tests.
  - Produced import-ready Excel sample for staff onboarding tests:
    - `test-data/tenant-staff-import-sample.xlsx` with 10 rows each for 3 existing tenants.
- **Validation:**
  - `dotnet build CargoMint.Api/CargoMint.Api.csproj` succeeds.
  - `npm -C apps/cargo-mint-web run build` previously succeeded for tenant-console updates.

## 38) Session Notes (2026-04-30) - Session 31
- **Tenant Staff Import Flow (End-to-End):**
  - Added tenant-admin staff import APIs:
    - `POST /api/v1/TenantAdmin/import/staff/preview`
    - `POST /api/v1/TenantAdmin/import/staff/confirm`
  - Added backend validation rules for import rows:
    - Required: email, role, temporary password.
    - Email format, duplicate-in-file detection, duplicate-in-database detection.
    - Role canonicalization and allowed-role guardrails.
    - Service centre name must exist within current tenant scope.
  - Added import execution reporting:
    - Per-row imported/failed status with detailed message.
    - Aggregate counts for total/imported/failed rows.
  - Added tenant UI staff import modal:
    - CSV upload, preview action, and confirm import action.
    - Preview table for valid/invalid rows with errors.
    - Result table for per-row import success/failure.
  - Staff management page now exposes `Import staff` action button.
- **Validation:**
  - `dotnet build CargoMint.Api/CargoMint.Api.csproj` succeeds.
  - `npm -C apps/cargo-mint-web run build` succeeds.

## 39) Session Notes (2026-04-30) - Session 32
- **Hub <-> Service Centre Reliability Hardening:**
  - Added explicit service-centre parent linkage in domain model:
    - `ServiceCentre.ParentHubId` + `ServiceCentre.ParentHub`.
    - EF relationship configured with restrict delete behavior.
  - Corrected hub-to-service-centre mapping source:
    - Listing now prefers `ParentHubId` and only falls back to station inference for legacy rows.
  - Enforced relationship validity on mutation paths:
    - Service-centre create now always persists `ParentHubId`.
    - Service-centre update now fails when target hub is invalid/out-of-tenant.
    - Reassignment updates both `ParentHubId` and station linkage.
  - Strengthened hub/service-centre import reliability:
    - Added duplicate row detection within upload batch.
    - Added per-row validation error reporting in API response.
    - Preserved counts while including clear error details.
  - Added integrity-safe deactivation commands/endpoints:
    - `PUT /api/v1/TenantAdmin/hubs/{id}/deactivate` blocked when active child service centres exist.
    - `PUT /api/v1/TenantAdmin/service-centres/{id}/deactivate` blocked when staff are still assigned.
  - Improved import feedback in tenant UI without structural changes:
    - Existing toast now includes first validation error when present.
- **Tests Added:**
  - CRUD and relationship consistency.
  - Tenant isolation on reassignment.
  - Import duplicate/invalid-row validation output.
  - Deactivation integrity checks for hub and service centre.

## 39) Session Notes (2026-04-30) - Session 32
- **Staff Management Hardening (Tenant Scoped):**
  - Enforced strict tenant scoping on staff status mutation handlers (`SuspendStaff`, `RestrictStaffLogin`) so cross-tenant staff updates are denied.
  - Hardened staff role assignment to use existing roles only (no auto-role creation during invite/update/import).
  - Added role-aware assignment validation with hub/service-centre checks:
    - `HubManager` must be assigned to a tenant hub.
    - `ServiceCentreAdmin` and `DeskOperator` must be assigned to a tenant service centre.
    - Supports reassignment between hub/service-centre targets with validation.
  - Extended staff import model/validation for hub assignment input (`HubName`) and role-bound assignment rules.
  - Updated tenant-admin UI invite/import payloads to send role-consistent assignment (`serviceCentreId` vs `hubId`) without altering existing flow structure.
  - Updated login routing so `ServiceCentreAdmin`, `DeskOperator`, and `HubManager` land in operations dashboard.
  - Added inactive-account login denial in `LoginHandler`.
  - Added API authorization tests for role behavior:
    - `ServiceCentreAdmin` blocked from `TenantAdmin` staff endpoints.
    - `TenantAdmin` allowed on `TenantAdmin` staff endpoints.
    - `ServiceCentreAdmin` allowed through logistics authorization gate.
- **Validation:**
  - `dotnet test CargoMint.Api.Tests/CargoMint.Api.Tests.csproj --no-build` passed for currently built test assembly.
  - Full rebuild/test is currently blocked by locked backend binaries from active `CargoMint.Api` process in this environment.

## 40) Session Notes (2026-04-30) - Session 33
- **Module 5: Tenant Price Engine Validation (Zones + Matrix):**
  - Replaced tenant pricing setup persistence from audit-log-only JSON fallback to real tenant-scoped domain storage:
    - Added `ZoneMatrixRate` entity (`OriginZoneId`, `DestinationZoneId`, `Price`, `TenantId`, `IsActive`).
    - Wired DbContext and EF configuration (`ZoneMatrixRates` table + tenant-scoped unique index on origin/destination pair).
  - Hardened tenant-admin pricing setup flow while preserving existing UI contract (`GET/PUT TenantAdmin/pricing`):
    - `SaveTenantPricing` now upserts active tenant zones, deactivates removed zones, and rebuilds tenant matrix cells.
    - `GetTenantPricing` now reloads zones + matrix from persistent tenant tables.
    - Pricing modifiers remain tenant-scoped and are persisted/reloaded per tenant.
  - Added explicit tenant-boundary guards in zone and matrix mutation handlers to prevent cross-tenant contamination even under mis-scoped context usage.
  - Added tenant-admin API endpoints for direct zone/matrix CRUD operations (no UI structure changes required):
    - `POST /api/v1/TenantAdmin/pricing/zones`
    - `PUT /api/v1/TenantAdmin/pricing/zones/{id}`
    - `DELETE /api/v1/TenantAdmin/pricing/zones/{id}`
    - `PUT /api/v1/TenantAdmin/pricing/matrix`
    - `DELETE /api/v1/TenantAdmin/pricing/matrix`
  - Generated migration `AddZoneMatrixRates` for deployable schema support.
- **Pricing Workflow Readiness:**
  - Updated `GetPriceQuote` to require valid tenant context and to use matrix self-cell fallback when classic zone-weight pricing is missing, preserving “missing matrix path => no quote” behavior.
- **Tests Added (Tenant Price Engine):**
  - `Zone CRUD`
  - `Matrix CRUD + reload`
  - `Missing matrix path`
  - `Invalid zone references`
  - `Tenant boundary failures`
  - File: `CargoMint.Api.Tests/PricingTenantValidationTests.cs`
- **Validation Run:**
  - `dotnet test CargoMint.Api.Tests/CargoMint.Api.Tests.csproj --filter "FullyQualifiedName~PricingTenantValidationTests"` passed (`5/5`).

## 40) Session Notes (2026-04-30) - Session 33
- **Tenant Admin Global Search Fix (Behavior-Only UI + Tenant-Scoped API):**
  - Removed search-input prefill risk by converting topbar search field to controlled state with `autoComplete="new-password"` and no email-linked field name.
  - Added real tenant-admin global search endpoint:
    - `GET /api/v1/TenantAdmin/search?q={query}&limit={n}`
    - Query/handler: `GetTenantGlobalSearchQuery` in tenant-admin slice.
  - Search now returns tenant-scoped multi-entity results across:
    - Staff and captains
    - Fleet vehicles
    - Hubs
    - Service centres
    - Merchants
    - Operational shipment records (waybill/receiver)
  - Added frontend debounce (300ms) and safe states:
    - empty (panel hidden)
    - loading
    - no results
    - invalid query
    - error
  - Added result click routing to existing management screens without changing shell layout:
    - staff -> staff edit modal
    - fleet -> fleet edit modal
    - hubs -> hub edit modal
    - service centres -> service-centre edit modal
    - merchants -> merchant edit modal
    - shipments -> dashboard context toast confirmation
- **Tests Added (`CargoMint.Api.Tests`):**
  - Search category coverage.
  - Tenant isolation (no cross-tenant leakage).
  - Partial-match behavior.
  - Invalid query behavior.
# 2026-04-30 - Tenant Admin Dashboard Integrity Hardening (Module 1)

- Hardened `GET /api/v1/TenantAdmin/dashboard` to return tenant-scoped, period-scoped metrics only.
- Added range-aware aggregation support (`today|week|month|custom` with `fromUtc`/`toUtc`) and surfaced period metadata in response.
- Expanded dashboard aggregates to include:
  - shipment status counts and performance rates
  - staff active/suspended breakdown
  - service-centre activity rollup
  - COD pending/collected summaries
  - lightweight metric trace metadata (`Trace`) + correlation id for QA verification
- Enforced explicit tenant filtering for additional dashboard-fed endpoints in application handlers:
  - fleet list
  - merchants list
  - tenant audit list
  - tenant settings branding/onboarding audit lookups
- Updated tenant-admin web data binding (no layout redesign) to:
  - consume expanded dashboard payload fields
  - support dashboard range query propagation via URL params
  - show loading/error dashboard states
  - correctly handle empty lists without stale carry-over
- Added focused dashboard integrity tests in `CargoMint.Api.Tests/TenantDashboardIntegrityTests.cs` covering:
  - happy path
  - tenant leakage prevention
  - empty dataset
  - invalid tenant context
  - custom range filtering

# 2026-04-30 - Captain/Fleet Assignment Workflow Hardening (Module 4)

- Implemented persisted captain-to-fleet linkage:
  - Added `Fleet.AssignedCaptainId` + relation mapping.
  - Added migration `20260430121018_CaptainFleetAssignments`.
- Added tenant-admin API support for assignment workflow:
  - `GET /api/v1/TenantAdmin/captains/eligible`
  - `POST /api/v1/TenantAdmin/fleet/{id}/assign-captain`
  - strengthened `PUT /api/v1/TenantAdmin/fleet/{id}` failure responses (`400` on invalid assignment).
- Enforced invalid assignment guards in application layer:
  - cross-tenant captain/fleet assignment blocked
  - inactive/locked/restricted captain assignment blocked
  - duplicate active vehicle assignment conflicts blocked
- Enabled driver-role staff eligibility path:
  - canonical role alias `driver -> Captain`
  - captain profile auto-creation when staff role is captain (invite/update flows)
  - import role canonicalization updated to accept `driver`.
- Added focused tests in `CargoMint.Api.Tests/CaptainFleetAssignmentWorkflowTests.cs` for:
  - driver role eligibility preview
  - persisted fleet assignment
  - inactive captain rejection
  - cross-tenant rejection
  - duplicate active assignment rejection
  - eligible captain filtering

# 2026-04-30 - Tenant Finance UI + Pricing Matrix Save Resilience

- Added tenant-scoped finance summary API for tenant console:
  - `GET /api/v1/TenantAdmin/finance`
  - aggregates wallets, wallet transactions, general ledger entries, invoice totals, and COD movement in one response.
- Added `Finance Management` section in tenant console UI (no layout redesign):
  - finance sidebar entry under Finance section
  - wallet/ledger/COD summary cards
  - top merchant wallet visibility
  - recent money movement table (wallet + ledger streams)
- Fixed pricing engine save path for multi-zone scenarios:
  - frontend now normalizes the matrix to a square payload based on current zone headers
  - duplicate zone names are blocked with user feedback
  - backend save handler now persists by zone order and tolerates partial/missing row payloads instead of rejecting full save
  - prevents multi-row/additional-zone save failures reported by tenant users
- Extended tenant finance visibility for operations teams:
  - finance API now returns full tenant merchant wallet list in addition to top wallets
  - tenant finance UI now includes searchable "All merchant wallets" table (search by merchant code or wallet ID)

# 2026-04-30 - Tenant Pricing UI Swap To Ops Structure

- Updated tenant console pricing UI to mirror the Operations Price Engine card structure while preserving existing tenant pricing save logic.
- Replaced tenant pricing layout in targeted areas only:
  - `Base rate matrix (NGN per shipment)` card now follows ops-style table structure with per-row edit icons.
  - `Surcharges & modifiers` now follows ops-style tabular layout, with editable fee values preserved.
  - added `+ Add zone` button at the bottom of the base rate card.
  - added full-width `Weight × Zone price matrix (₦) — click cells to edit` card for matrix editing/saving.
- Enhanced tenant `addPricingZone()` DOM behavior to update both:
  - the editable full-width matrix table, and
  - the base-rate summary card table
  so visual state remains in sync before save/reload.
