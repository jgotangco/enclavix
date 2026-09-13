# 🛡️ Enclavix — HOA & Enclave Operating System

> **The Intelligent Operating System for Boutique Residential Enclaves & Homeowners Associations.**

Enclavix is a concept for a community governance platform designed specifically for private gated villages, townhouse developments, and residential subdivisions. It unifies automated formula-driven dues computation, dual-gate RFID security clearance, elevated curbside parking quota enforcement, domesticated pet health tracking, and role-based stakeholder portals.

---

## 🌟 Key Features & Capabilities

- 🛡️ **Dual-Tier Gate Access & RFID Barrier Clearance:**
  - Automated boom barrier RFID verification (`RFID-GE-XXXXX`).
  - 6-digit visitor QR pass code lookup and walk-in entry pass generator.
  - Dedicated Guard Security Kiosk with incident citation logging.
- 🚗 **Smart Parking & Curbside Allowance Matrix:**
  - Enforces property slot limits (indoor garage capacity + strict 1-curb elevated parallel parking rule).
  - Tracks vehicle types (`SUV`, `SEDAN`, `VAN`, `HATCHBACK`, `PICKUP`, `MOTORCYCLE`, `EV`, `OTHER`), driver names, and LTO OR/CR documentation.
- 💳 **Formula-Driven Dues Engine & GCash Audit:**
  - Transparent formula: $\text{Total Dues} = (\text{Lot Area} \times \text{Rate/m}^2) + \text{Base Maintenance Fee} + \text{Mother Village Fee}$.
  - Resident GCash/bank transfer receipt upload with treasury verification and instant receipt generation.
- 🐾 **Domesticated Pet Registry & Rabies Compliance:**
  - Mandatory pet cataloging, breed registry, and anti-rabies vaccination expiry alerts.
- 👥 **Dual-Tier Role & Officer Designation Engine:**
  - Independent **System Access Roles** (`SUPER_ADMIN`, `TREASURER`, `GUARD`, `RESIDENT`) dictate portal views.
  - Granular **Civic Officer Positions** (`PRESIDENT`, `VICE_PRESIDENT`, `SECRETARY`, `TREASURER_OFFICER`, `AUDITOR`, `BOARD_MEMBER`, `COMMITTEE_HEAD`, `PROPERTY_MANAGER`, `NONE`).
  - Flexible **Affiliation Designations** (`HOMEOWNER`, `TENANT`, `HOA_EMPLOYEE`, `PROPERTY_STAFF`, `SECURITY_PERSONNEL`, `EXTERNAL_VENDOR`).
- 🎨 **Real-Time Persona Theme Engine:**
  - Instant CSS DOM switching: *Executive Emerald*, *Treasury Gold*, *Ocean Azure*, *Tactical Obsidian*, and *Midnight Modern*.
- ☁️ **Cloud Native & Cloud Run Ready:**
  - Next.js 14 App Router, Supabase PostgreSQL schemas with Row-Level Security, multi-stage Docker containerization, and Cloud Build CI/CD.

---

## 🚀 Technology Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Database / Auth:** [Supabase](https://supabase.com/) / PostgreSQL
- **Deployment:** [Google Cloud Run](https://cloud.google.com/run) / Docker

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm / yarn / pnpm

### 2. Installation
```bash
git clone https://github.com/jgotangco/enclavix.git
cd enclavix
npm install
```

### 3. Environment Setup
Create a `.env.local` file based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to access the application.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔐 Default Demo Accounts

All seeded demo accounts use the standard password: **`Password123!`**

| User Name | Email | System Access Role (Portal) | Community Designation | Affiliation |
| :--- | :--- | :--- | :--- | :--- |
| **Carlos Valdez** | `admin@enclavehoa.com` | `SUPER_ADMIN` (Admin Console) | Independent System Admin | HOA Employee |
| **Juan Dela Cruz** | `resident@enclavehoa.com` | `RESIDENT` (Resident Portal) | HOA President | Homeowner (Blk 2 Lot 1) |
| **Ma. Elena Cruz** | `treasurer@enclavehoa.com` | `TREASURER` (Finance Console) | HOA Treasurer | Homeowner (Blk 3 Lot 4) |
| **Victoria Santos** | `victoria.santos@gmail.com` | `RESIDENT` (Resident Portal) | HOA Secretary | Homeowner (Blk 1 Lot 4) |
| **Maricel Dizon** | `staff@enclavehoa.com` | `SUPER_ADMIN` (Admin Console) | Property Manager | HOA Employee |
| **Rodrigo Bautista** | `guard@enclavehoa.com` | `GUARD` (Security Kiosk) | Gate 1 Duty Officer | Security Staff |
| **Michael Reyes** | `mreyes@corp.ph` | `RESIDENT` (Resident Portal) | Resident Member | Tenant (Blk 2 Lot 3) |

---

## 👨‍💻 Credits & Attribution

Designed and product-directed by **[Jerome Gotangco](https://github.com/jgotangco)**. Developed with **Google Antigravity / Gemini**.

- **Product Lead & Design:** [Jerome Gotangco (GitHub: @jgotangco)](https://github.com/jgotangco)
- **Source Repository:** [https://github.com/jgotangco/enclavix](https://github.com/jgotangco/enclavix)

---

## 📄 License
This project is licensed under the MIT License.
