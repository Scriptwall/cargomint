# Release Notes: CargoMint v0.1.0-alpha

We are excited to announce the first alpha release of **CargoMint**, a multi-tenant logistics operating system designed for the African market.

## 🚀 Key Features in this Release
- **Tenant Isolation**: Secure, multi-tenant architecture using global query filters.
- **End-to-End Shipment Lifecycle**: From booking at the Desk to Dispatch and Proof of Delivery.
- **Manifesting & Sorting**: Advanced manifest builder with drag-and-drop shipment grouping.
- **White-Label Support**: Tenant-specific branding and configuration.
- **Captain Mobile Interface**: Progressive workflows for drivers and captains.

## 🏗 Architecture Highlights
- Built on **.NET 8** and **EF Core 8**.
- Implements **Clean Architecture** with a **Vertical Slice** feature organization.
- MediatR-based CQRS for lean and maintainable API controllers.

## ⚠️ Important Notes
- This is an **Alpha** release intended for testing and demonstration.
- Database migrations are subject to change in upcoming patches.

---

### How to use this Release
1. Pull the `v0.1.0-alpha` tag.
2. Run the `CargoMintDbInitializer` to seed the professional subscription plans.
3. Access the Master Console to provision your first tenant.

---
*For a full list of changes, see the [CHANGELOG.md](./CHANGELOG.md).*
