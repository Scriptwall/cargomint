# CargoMint Final Build Charter (v3.1 Updated)

## 1. Product Mission
CargoMint is a multi-tenant, white-label logistics operating system for Africa.
CargoMint is the system of record for shipments, delivery status, COD, and actor relationships.

## 2. Non-Negotiable Principles
- **End-to-end actor autonomy**: Each actor must complete their workflow without dependency dead ends.
- **Tenant-scoped everything**: Multi-tenancy enforced via `IMustHaveTenant` and global query filters. No cross-tenant data leakage.
- **White-label by default**: Tenant branding drives the experience for merchants and consumers.
- **No floating shipments**: Every shipment must have an accountable tenant and clear custody chain.
- **Simple first**: Phase 1 focus on core SaaS before marketplace complexity.

## 3. Architecture Rules (Engineering)
- **Vertical slices only**: Organize by feature (e.g., `Logistics`, `Accounting`), not by layer.
- **Skinny controllers**: Controllers only delegate to MediatR handlers.
- **Lean methods**: Keep methods under 30 lines by extracting helper/domain services.
- **Rich domain**: Business logic resides in entities and domain services, not handlers.
- **Primary Constructors**: Use C# 12 primary constructors and file-scoped namespaces.
- **Async I/O everywhere**: Use `Task` with `async/await` for all DB and external calls.
- **Use records**: For request/response DTOs.

## 4. Runtime Stack
- **Runtime**: .NET 8 / C# 12
- **API**: ASP.NET Core
- **Data**: EF Core 8/9 (SQL Server)
- **CQRS**: MediatR
- **Mapping**: Mapperly
- **Validation**: FluentValidation
- **API Docs**: Scalar/Swagger (OpenAPI 3.0)

## 5. Project Layout (4 Projects)
- **CargoMint.Domain**: entities, value objects, domain exceptions, interfaces
- **CargoMint.Application**: commands, queries, handlers, DTOs, mappers, business orchestration
- **CargoMint.Infrastructure**: db context, repositories, identity, external clients
- **CargoMint.Api**: endpoints/controllers, middleware, composition root

## 6. Actor and Portal Model
- **Super Admin**: Platform governance and tenant provisioning.
- **Tenant Admin**: Full operational control over a specific tenant's data.
- **Hub Manager**: Scoped role focused on Hub-level manifesting and dispatch.
- **Desk Operator**: Scoped role for shipment creation and processing at a specific Service Centre.
- **Merchant**: Self-service portal for shipment booking and tracking.
- **Captain**: Mobile app for scans, manifests, and delivery proof.
- **Consumer**: Public tracking and booking interface.
- **Fleet Tenant**: Standalone vehicle/captain providers (Phase 2).

## 7. Geography & Logistics Hierarchy
The system enforces a strict hierarchy for pricing resolution and routing:
**Country -> Region -> State -> Station -> Service Centre**
- **Geography**: Strict tree structure (Country 1:N State 1:N Station). 
- **Station**: The physical geographic town/location (e.g., "Ikeja"). All operational facilities **must** be linked to a Station for pricing resolution.
- **Service Centre**: The operational facility. A Service Centre is either a **Hub** (aggregation point) or a standard **SC** (collection point).
- **Hub-SC Link**: Managed via a nullable `ParentHubId`. Standard SCs report to a Hub; Hubs (and independent SCs) have a null parent.

## 8. Shipment Workflow Invariants
The custody chain must be preserved at every step:
1. **Creation**: Booking at Desk or via Merchant API.
2. **Pricing**: Resolved via **Weight x RouteZone (1–5)**.
3. **Sorting/Bagging**: Shipments are grouped into `ShipmentGroups` (Bags) with unique seal numbers.
4. **Manifesting**: Bags/Shipments assigned to a `Manifest`.
5. **Dispatch**: Manifest linked to a `FleetTrip` (Vehicle + Captain).
6. **Scan Updates**: Tracking events triggered at every handover point.
7. **Delivery Proof**: OTP + Signature (+ optional Photo).
8. **Settlement**: Financial clearing of COD and fees.

## 9. Pricing & Zones
- **Standardized Zones**: Platform-wide zones (1–5) define distance logic (Local, Adjacent, Regional, National, Remote).
- **Matrix Engine**: Tenants configure prices based on a weight-zone matrix.
- **Contract Rates**: Merchant-specific rate cards override default pricing automatically.
- **Trip Fees**: Fleet pricing is trip-level, not per-shipment (Phase 2 focus).

## 10. API and Interface Requirements
- **API-first**: All actor workflows must be accessible via documented API endpoints.
- **Public Access**: Tracking and quotes must support unauthenticated access by Waybill/Search.
- **Webhooks**: Required for Paystack/Flutterwave wallet consistency and merchant notifications.

## 11. Phase Scope Guardrails
### Phase 1 (Must Ship First)
- Master Console (Super Admin)
- Operations Dashboard (Tenant Admin / Hub / Desk)
- Merchant Portal
- Consumer App (Booking/Tracking)
- Captain App (Dispatch/Proof)
- Manual carrier selection for platform merchants

### Phase 2 (Future)
- Standalone Fleet Tenant Portal
- Fleet marketplace and auto-matching
- Partner API for third-party systems
- Advanced marketplace settlement logic

## 12. Definition of Done
- **Naming**: Follows `CreateShipmentCommand`, `ShipmentsController` etc.
- **Tenant Safety**: `IMustHaveTenant` applied to all operational entities.
- **Validation**: FluentValidation for all commands.
- **Audit**: Audit events recorded for critical mutations.
- **Test Coverage**: Happy path + role-based boundary failures.

## 13. Universal Guardrail Prompt
Before implementation, follow these non-negotiables:
- Do not distort or redesign the existing UI structure.
- Do not replace working layouts/components; only enhance logic and reliability.
- Enforce tenant-scoped boundaries in all reads/writes.
- Deliver true end-to-end behavior (no fake success states).
- Keep architecture aligned with existing CargoMint conventions (CQRS, validation, skinny controllers, rich domain rules).

## 14. Administrative Isolation & Security
To prevent accidental management or deletion of system-critical accounts:
- **Admin Isolation**: All administrative accounts (`TenantAdmin`, `SuperAdmin`, `Admin`) must be strictly filtered out from standard staff lists and global search results.
- **Filtering Fail-safe**: Isolation is enforced at the backend query level using a dual-layered check:
    1. Role membership check (any role containing "Admin").
    2. Email-based exclusion (any email containing "admin@").
- **Self-Service Only**: Administrative users manage their own profiles (e.g., password changes) via a dedicated, secure User Profile menu, bypassing the standard staff management CRUD flows.

## 15. SaaS Financials & Automation
The system implements a resilient, automated financial pipeline for subscription and revenue governance:
- **Automated Billing**: Recurring Hangfire jobs manage the entire lifecycle: Invoicing -> Dunning -> Trial Expiry -> Account Suspension.
- **Subscription Guardrails**: MediatR `SubscriptionBehavior` enforces financial compliance. Tenants with "Suspended" or "Restricted" status are blocked from creating manifests or dispatching shipments (402 Payment Required).
- **Communication Resilience**: All financial notifications (Invoice Reminders, Suspension Alerts) are routed through SendGrid/SMTP with comprehensive try-catch wrappers to ensure that email service failures do not block the execution of background financial logic.
- **Manual Intervention**: The Master Console provides manual "Run Now" triggers for all background jobs, enabling audit-ready manual intervention without direct database manipulation.
- **Idempotent Initialization**: The `CargoMintDbInitializer` serves as the system of record for the professional Subscription Plan catalog (Free, Starter, Growth, Enterprise).
