# 🚚 CargoMint

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4.svg)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000.svg)](https://nextjs.org/)

**CargoMint** is a high-performance, multi-tenant logistics operating system engineered for the African market. It serves as the unified system of record for shipments, delivery status, COD, and actor relationships.

---

## 🌟 Overview

CargoMint is designed to solve the complexities of modern logistics in emerging markets. It provides end-to-end autonomy for all actors in the supply chain—from merchants booking shipments to captains delivering at the last mile.

### Core Mission
- **System of Record**: Single source of truth for all shipment data.
- **Tenant Isolation**: Strict multi-tenancy with white-label support.
- **Custody Chain**: Transparent tracking from booking to settlement.

---

## 🚀 Key Features

### 🏢 Operations & Management
- **Multi-Tenant Architecture**: Enforced isolation via `IMustHaveTenant`.
- **Logistics Hierarchy**: Structured routing (Country → Region → State → Station → Service Centre).
- **Service Centre Workflows**: Specialized portals for Hub Managers and Desk Operators.
- **White-Labeling**: Custom branding per tenant (Merchant and Consumer portals).

### 📦 Shipment Lifecycle
- **Intelligent Pricing**: Matrix-based pricing resolved by Weight × Route Zones (1–5).
- **Manifesting & Dispatch**: Group shipments into bags and manifests linked to fleet trips.
- **Real-time Tracking**: Granular scan updates at every handover point.
- **Proof of Delivery (PoD)**: Multi-factor verification (OTP + Signature + Photo).

### 💳 Financials & Accounting
- **Wallet System**: Integrated wallet management for merchants and tenants.
- **Settlement Logic**: Automated clearing for COD and service fees.
- **SaaS Billing**: Automated subscription management via recurring Hangfire jobs.

---

## 🏗️ Architecture

CargoMint is built on modern enterprise patterns for maximum reliability and scalability:

- **Vertical Slice Architecture**: Feature-based organization (Logistics, Accounting, etc.) instead of generic layers.
- **Clean Architecture**: Decoupled Domain, Application, Infrastructure, and API layers.
- **CQRS**: Command Query Responsibility Segregation via **MediatR**.
- **Domain-Driven Design (DDD)**: Business logic encapsulated in rich entities and domain services.

---

## 📱 Application Ecosystem

| Application | Role | Technology |
|---|---|---|
| **cargo-mint-web** | Admin & Operations Dashboard | Next.js, Tailwind CSS |
| **cargo-mint-captain** | Mobile App for Driver/Captain Scans | React Native / Hybrid |
| **cargo-mint-consumer** | Public Tracking & Booking Portal | Next.js (SEO Optimized) |

---

## 🛠️ Tech Stack

- **Backend**: .NET 8 / C# 12
- **Persistence**: EF Core 8/9 (PostgreSQL / SQL Server)
- **Messaging**: MediatR (In-process mediator)
- **Validation**: FluentValidation
- **Background Jobs**: Hangfire
- **Frontend**: Next.js 14+, Vanilla CSS (Theme-able)

---

## 🏁 Quick Start

### 1. Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (or Docker)

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/Scriptwall/cargomint.git
cd cargomint

# Configure environment
cp .env.example .env

# Launch database and services
docker compose up -d

# Start the API
cd CargoMint.Api
dotnet run
```

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for the future of African Logistics.*
