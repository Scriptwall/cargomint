# Changelog

All notable changes to **CargoMint** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha] - 2026-05-10

### Added
- **Multi-tenant Architecture**: Isolated shipment data and tenant-scoped governance.
- **Manifest Workflows**: Complete flow for sorting, bagging, and manifesting shipments.
- **Service Centre Operations**: Hub and standard Service Centre management.
- **Merchant Portal**: Self-service interface for shipment booking and tracking.
- **Captain Mobile Interface**: Mobile-ready workflows for dispatch and proof of delivery.
- **Pricing Matrix Engine**: Weight-based and zone-based pricing resolution.
- **Tracking Workflows**: Public and authenticated shipment tracking.

### Architecture
- **Clean Architecture**: Decoupled layers (Domain, Application, Infrastructure, Api).
- **Vertical Slice Design**: Features organized by capability rather than technical layer.
- **MediatR Pipeline**: CQRS pattern implementation for lean controllers.

### Security
- **JWT Authentication**: Secure stateless authentication for all portals.
- **Tenant Isolation**: Global query filters and `IMustHaveTenant` enforcement.

### Notes
Initial public alpha release of the CargoMint logistics operating system.
