# CargoMint 2.0 — Technical Blueprint & Architecture Guide

## 1. Architectural Philosophy
CargoMint 2.0 is built on the **Clean Vertical Slice Architecture**. 

### 1.1 Vertical Slices vs. Layers
Unlike traditional N-Layer architecture where logic is horizontal (Controllers -> Services -> Repositories), CargoMint organizes code by **Function**. 
*   Everything a feature needs (Command, Query, Validation, Logic, DTO) lives in a single folder.
*   **Benefit:** Zero-friction navigation. To change "Pricing," you look at the Pricing folder, not three different projects.

### 1.2 The "Skinny" Pattern
*   **Controllers:** Act only as high-traffic routers. They "Send" a request to MediatR and return an `IActionResult`. No business logic allowed.
*   **Domain Entities:** "Rich" models. Logic that belongs to the data (like `VolumetricWeight` on a `ShipmentItem`) stays inside the entity.

---

## 2. Core Technology Stack (Verified)
*   **Runtime:** .NET 8 (LTS) / C# 12
*   **API:** ASP.NET Core
*   **Mediator:** MediatR (Decoupling the API from the Logic)
*   **ORM:** EF Core 8/9 with SQL Server
*   **Mapping:** Mapperly
*   **Validation:** FluentValidation
*   **Background Jobs:** Hangfire (for Billing, Dunning, and Trial Expiry)
*   **Frontend:** Next.js 14+ (App Router), React, TailwindCSS
*   **Mobile (Captain App):** React Native / Expo
*   **Communication:** REST via System.Net.Http (Paystack/Flutterwave/DHL integrations)
*   **Documentation:** Scalar / OpenAPI 3.0

---

## 3. Implementation Status (Current State)

### 3.1 Foundation (Completed)
- [x] **Multi-Tenancy:** Enforced via `IMustHaveTenant` and global query filters.
- [x] **Tenant Resolution:** Fallback chain (JWT -> Header -> Query Param).
- [x] **Auth Matrix:** Role-based access control (`SuperAdmin`, `TenantAdmin`, `HubManager`, `DeskOperator`, `Merchant`, `Captain`).
- [x] **Global Exception Handling:** Centralized middleware for consistent API responses.

### 3.2 Master Console (Super Admin) - [Built]
- [x] **Tenant Provisioning:** End-to-end onboarding with auto-created admin accounts.
- [x] **Finance Oversight:** Cross-tenant ledgering, subscription monitoring, and platform-wide GMV tracking.
- [x] **Geography Management:** Hierarchical data entry (Country -> State -> Station).
- [x] **Platform Governance:** Tenant suspension, global audit logs, and finance control actions.

### 3.3 Tenant Console (Tenant Admin) - [Built]
- [x] **White-Labeling:** Custom branding (Colors, Logo, Tagline) injected at runtime.
- [x] **Network Setup:** Hub and Service Centre management with bulk import tools.
- [x] **Staff Management:** Role-based invites and SC-scoped assignments.
- [x] **Pricing Engine:** Tenant-specific Rate Matrix (Weight x Zone) and surcharges.
- [x] **Fleet Operations:** Vehicle registration and Captain assignment.
- [x] **Billing:** Automated subscription lifecycle (Trial -> Active -> Dunning -> Suspended).

### 3.4 Operations Dashboard (Hub/SC Staff) - [Built]
- [x] **Shipment Lifecycle:** Creation (Desk/Merchant), Pricing resolution, and Tracking.
- [x] **Packaging:** Sorting shipments into Bags with unique seal numbers.
- [x] **Manifesting:** Grouping Bags/Shipments for dispatch.
- [x] **Dispatch:** Trip initiation and Captain handover.

### 3.5 Consumer & Merchant Portals - [Built]
- [x] **Public Tracking:** Waybill-based timeline views without login.
- [x] **Public Quotes:** Itemized pricing calculation for non-users.
- [x] **Merchant API:** Webhook management and API key provisioning.
- [x] **Booking Wizard:** Multi-step package booking flow.

### 3.6 Captain App (Mobile) - [Built]
- [x] **Active Manifests:** Real-time trip status and progress tracking.
- [x] **Scanning:** Handover scans (Arrived, Loaded, In Transit).
- [x] **Proof of Delivery (POD):** OTP verification, Signature capture, and Photo proof.

---

## 4. Module Deep-Dive

### 4.1 Logistics & Operations
*   **Purpose:** Manages the movement of goods from terminal to terminal.
*   **Core Entities:** `Fleet`, `Captain`, `FleetTrip`, `Manifest`, `ManifestItem`, `ShipmentGroup` (Bags).
*   **Key Logic:** Custody Chain. Tracking every scan event to ensure accountability at every handover point.

### 4.2 Pricing Engine
*   **Purpose:** Real-time quote generation based on global geography.
*   **Core Entities:** `Country`, `State`, `Station`, `Zone`, `ZoneMatrixRate`, `RouteZoneMap`.
*   **Key Logic:** Matrix Engine. Resolves pricing by matching origin/destination stations to Zones and looking up the Rate Matrix for the specific weight class.

### 4.3 Financial Audit & Subscriptions
*   **Purpose:** Ensuring fiscal accountability and automated revenue collection.
- [x] **Double-Entry Ledgering:** Every shipment and transaction is recorded in the `GeneralLedger`.
- [x] **Subscription Pipeline:** Automated Hangfire jobs handle invoicing, dunning, and account suspension based on payment status.
- [x] **Wallet System:** Merchant and Tenant wallets for pre-paid operations and platform settlements.

---

## 5. Database Schema (Primary Clusters)
| Table Cluster | Primary Tables |
| :--- | :--- |
| **Identity** | `Users`, `Roles`, `Tenants`, `TenantsDetails` |
| **Geographic** | `Countries`, `States`, `Stations`, `ServiceCentres`, `Hubs` |
| **Financial** | `Invoices`, `GeneralLedgers`, `Wallets`, `WalletTransactions` |
| **Subscription** | `SubscriptionPlans`, `TenantSubscriptions`, `SubscriptionInvoices` |
| **Operational** | `Shipments`, `Manifests`, `Fleet`, `Captains`, `ShipmentGroups` |
| **Pricing** | `Zones`, `ZoneMatrixRates`, `RouteZoneMaps` |

---

## 6. Future Roadmap (Phase 2 Focus)
These modules are architecturally ready but pending full implementation:

### 6.1 Fleet Marketplace
*   **Proposed Logic:** `PartnerFleetProvider`.
*   **Workflow:** Enabling third-party fleet owners to list vehicles and bid for trips.

### 6.2 Advanced SLA Engine
*   **Workflow:** Automated alerting when shipments exceed the `SlaBaseline` for specific route legs (e.g., "Delayed at Hub").

### 6.3 Warehouse & Last Mile (WMS Lite)
*   **Proposed Logic:** Bin-level tracking within Hubs for high-volume sorting centers.

---

## 7. How to Extend
To add a new feature (e.g., "Insurance Claims"):
1.  **Domain:** Add the `Claim.cs` entity to `CargoMint.Domain`.
2.  **Application:** Create a `Features/Claims` folder in `CargoMint.Application`. Add `FileClaimCommand` and `FileClaimHandler`.
3.  **Api:** Add a `ClaimsController` (Skinny) in `CargoMint.Api`.
4.  **Audit:** Ensure all mutations emit events for the `AuditLog`.
5.  **Tenant Safety:** Ensure the entity implements `IMustHaveTenant` if it's operational data.
