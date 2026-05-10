# CargoMint 2.0: Demo Accounts & Testing Guide

Use the following credentials to test the API via Swagger or the Frontend. 
**Note:** All accounts use the same default password for ease of testing.

---

## Default Password
**`Password123!`**

---

## Account List by Role

| Email | Role | Purpose |
| :--- | :--- | :--- |
| **admin1@cargomint.com** | Admin | Full system access, platform settings. |
| **tenantadmin@swiftlog.com** | TenantAdmin | Tenant workspace access, operations, fleets. |
| **operator2@cargomint.com** | Operator | Hub operations, scanning, and manifest creation. |
| **captain3@cargomint.com** | Captain | Fleet dispatch and trip management. |
| **partner4@cargomint.com** | Partner | 3rd party carrier tracking and integration. |
| **customer5@cargomint.com** | Customer | Shipment creation and personal tracking. |
| **admin6@cargomint.com** | Admin | Secondary admin for multi-user tests. |
| **operator7@cargomint.com** | Operator | Regional hub operator. |
| **captain8@cargomint.com** | Captain | Regional truck driver. |
| **partner9@cargomint.com** | Partner | Regional 3PL provider. |
| **customer10@cargomint.com** | Customer | Regular e-commerce customer. |
| **admin11@cargomint.com** | Admin | System audit account. |
| **operator12@cargomint.com** | Operator | Last-mile delivery sorter. |

---

## How to Test on Swagger

1.  **Login:** Navigate to `POST /api/v1/Account/login`.
2.  **Get Token:** Provide one of the emails above and the default password. Copy the `token` from the response.
3.  **Authorize:** Click the green **"Authorize"** button at the top of the Swagger page.
4.  **Paste:** Type `Bearer ` followed by your token (e.g., `Bearer eyJhbGci...`).
5.  **Execute:** You can now call protected endpoints like `/api/v1/Shipments` or `/api/v1/Consolidation/scan`.

---
*This file is for demonstration and local testing purposes only.*
