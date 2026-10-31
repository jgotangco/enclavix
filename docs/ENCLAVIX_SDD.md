> Historical prototype documentation. For current production requirements and implementation scope, read [Start here](START_HERE.md) and [BRD](BRD.md). Capabilities described below are not production acceptance evidence.

# 🛡️ Enclavix — Software Design Document & Technical Specification

**Product:** Enclavix (HOA & Enclave Operating System)  
**Target Community Model:** Boutique Residential Enclaves (~150 Lots, Sub-Enclave Architecture)  
**Version:** 2.0.0 (Cloud Run Ready)  
**Core Stack:** Next.js 14 (App Router), TypeScript 5, Tailwind CSS, Supabase (PostgreSQL, Row-Level Security, Storage), Docker

---

## 1. Executive Summary & Domain Architecture

Enclavix is an enterprise-grade platform built specifically for gated townhouses, boutique subdivisions, and residential enclaves.

### Unique Domain Characteristics
1. **Sub-Enclave Dynamics:** Residents clear both the mother subdivision gates and inner enclave boom barriers.
2. **Variable Dues Calculation:** Lot sizes vary across 150 units. Dues formula: $\text{Total} = (\text{Lot Area} \times \text{Rate/m}^2) + \text{Base Maintenance} + \text{Mother Village Passthrough}$.
3. **Smart Parking & Curbside Policy:** Each property is allocated garage slots + a strict **one (1) vehicle parallel-parked elevated above the unit curb** to prevent street blockage.
4. **Domesticated Pet Health & Safety:** Anti-rabies certification tracking, vaccination expiration warnings, and leash/waste compliance.
5. **Separation of Concerns (Governance vs. System Roles):** System Access Roles (`SUPER_ADMIN`, `TREASURER`, `GUARD`, `RESIDENT`) dictate actual portal UI, while Officer Positions (`PRESIDENT`, `SECRETARY`, `BOARD_MEMBER`, etc.) and Affiliation Types (`HOMEOWNER`, `TENANT`, `HOA_EMPLOYEE`) track civic and payroll designations.
6. **Real-Time Persona Theme Engine:** Dynamic CSS variable switching for Executive Emerald, Treasury Gold, Ocean Azure, Tactical Obsidian, and Midnight Modern.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------+
|                             CLIENT TIER                               |
|   Next.js 14 (App Router, React 18, Server Components, Lucide)        |
|   Tailwind CSS + Dynamic CSS Variable Theme Engine                    |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                            BACKEND & DB                               |
|   Supabase PostgreSQL (150 Lots Schema, RLS, Views)                  |
|   Supabase Auth & Session Cookies                                     |
|   Supabase Storage (OR/CR, Vaccine Cards, GCash Payment Slips)        |
+-----------------------------------------------------------------------+
```

---

## 3. Database Schema

- `properties` (150 Lots, block/lot, lot_area_sqm, carport_capacity, curb_parallel_allowance)
- `profiles` (User accounts, system role, officer position, affiliation type, lot assignment, phone, emergency contact)
- `vehicles` (Plate number, vehicle type, make/model, color, driver name, OR/CR, RFID tag, parking slot)
- `pets` (Species, breed, pet name, rabies vaccine expiry, photo, tag no)
- `invoices` & `payments` (Formula dues computation, GCash/bank slips, verification audit, official receipts)
- `visitor_passes` & `gate_logs` (6-digit QR pass codes, RFID boom gate entries, walk-in clearances)
- `amenity_reservations` (Conflict-free pool and clubhouse booking calendar)
- `helpdesk_tickets` (Categorized resident requests and resolution status)
- `violations` (Photo-backed parking, curbside, pet, or noise citations)
