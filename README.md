# CKTracker — Production Modular Kitchen Business Management System

[![CI/CD Pipeline](https://github.com/example/cktracker/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/example/cktracker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-teal.svg)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-v18-cyan.svg)](https://react.dev/)

**CKTracker** is a full-stack, enterprise-grade business management SaaS platform engineered specifically for modular kitchen manufacturers, studios, and interior design firms. It manages the complete customer lifecycle from first showroom walk-in inquiry to 2D/3D design, itemized quotations, raw material allocation, factory CNC manufacturing, delivery, on-site installation, and final 10-year warranty activation.

---

## 1. System Architecture & Tech Stack

```
[ React 18 + Vite + Tailwind CSS SPA ]
                   │ (REST APIs + Socket.IO WebSockets)
                   ▼
[ Express.js Modular Monolith Backend (Node.js v22) ]
   ├── JWT Auth & Role-Based Access Control (RBAC)
   ├── 14-Stage Sequential Lifecycle Engine
   ├── 2D/3D Kitchen Design Versioning & Client Sign-Off
   ├── Automated Quotation Engine & PDFKit Document Generator
   ├── Raw Material Inventory & Supplier Purchase Orders
   ├── Milestone Payment Tracker & Receipt Generator
   ├── Real-Time Event Notification Broadcaster (Socket.IO)
   ├── Nodemailer / SMTP Notification Service
   └── Modular WhatsApp Business API Adapter
                   │ (Prisma ORM)
                   ▼
[ PostgreSQL Relational Database ] (26 Normalized Models)
```

For in-depth architectural patterns, ER diagrams, and state transitions, see [ARCHITECTURE.md](file:///c:/Users/Ankita%20Chopra/OneDrive/Desktop/cktracker/ARCHITECTURE.md).  
For the complete API reference, endpoints, and request schemas, see [API_DOCUMENTATION.md](file:///c:/Users/Ankita%20Chopra/OneDrive/Desktop/cktracker/API_DOCUMENTATION.md).

---

## 2. Distinct Role Dashboards

### 1. Admin Portal (`ADMIN`)
- **Executive BI Analytics**: Total pipeline value, collected revenue, outstanding dues, customer conversion funnel, and stage delay analysis.
- **Project Oversight**: View and manage all projects, enforce stage progressions, and audit delay logs.
- **Financial Control**: Generate revisions of itemized quotations, create invoices, record milestone payments, and download receipts.
- **Material & Supply Chain**: Inventory reorder alerts, raw material allocation checks, and supplier Purchase Orders.
- **Team Management**: Staff registration, role assignments, and performance monitoring.

### 2. Manager Portal (`MANAGER`)
- **Customer CRM**: Lead pipeline management across 7 stages (`NEW` → `CONVERTED`).
- **Site Surveys**: Schedule and track laser site measurements and plumbing/electrical inspections.
- **Field Project Execution**: Oversee assigned customer projects, upload stage photographs, update permitted stages (1 through 13), and log delay reasons.
- **Customer Support**: Track client snags and coordinate corrective actions.

### 3. Customer Self-Service Portal (`CUSTOMER`)
- **Live 14-Stage Progress Tracker**: Real-time visual timeline showing completed, active, and upcoming milestones with estimated completion dates.
- **2D Layouts & 3D Renders**: View photorealistic designs, approve layouts, or submit revision feedback with comments.
- **Quotations & Proposals**: Transparent line-item pricing (carcass, shutters, hardware, countertop, GST) with one-click digital approval/rejection and PDF download.
- **Billing & Receipts**: View invoice summaries, transaction history, balance remaining, and download official payment receipts.
- **Support & 10-Year Warranty**: View warranty certificates for Blum/Hettich hardware and woodwork, or raise service requests.

---

## 3. Strict 14-Stage Project Workflow

Every project automatically progresses through 14 sequential engineering and construction stages:

1. **Customer Registration & Requirements Gathering**
2. **Site Measurement & Technical Survey** (laser wall survey, plumbing, electrical)
3. **2D Layout & 3D Kitchen Design Preparation**
4. **Customer Design Presentation & Approval** (client digital sign-off)
5. **Quotation Preparation & Cost Estimation** (carcass, shutters, hardware, countertop, 18% GST)
6. **Quotation Approval & Advance Payment** (50% production advance)
7. **Raw Material Procurement & Stock Allocation** (marine ply, acrylic sheets, Blum/Hettich hardware)
8. **Factory Manufacturing & CNC Edge Banding** (precision panel sizing & PUR banding)
9. **Factory Quality Inspection (QC Audit)** (shutter alignment & tolerance verification)
10. **Protective Packaging & Site Dispatch**
11. **On-Site Modular Installation** (carcass leveling, countertop cutout, sink & hob fitting)
12. **Final Inspection & Snag List Rectification**
13. **Customer Handover & Sign-Off**
14. **Project Completed & Warranty Activation** (10-year hardware warranty certificate)

*Business Guardrail: Stage $N$ cannot be completed until Stage $N-1$ is completed. Marking a stage as `DELAYED` requires an audited delay reason.*

---

## 4. Test Accounts & Pre-Seeded Credentials

All accounts are pre-seeded in the database for immediate testing:

| Role | Email | Password | Pre-loaded Context |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cktracker.com` | `Admin@123` | Complete business oversight across all customer projects. |
| **Manager** | `manager.rahul@cktracker.com` | `Manager@123` | Assigned to Sharma Island Kitchen project and leads. |
| **Designer** | `designer.priya@cktracker.com` | `Designer@123` | Uploaded 2D/3D renders for Sharma & Verma projects. |
| **Customer** | `customer.sharma@gmail.com` | `Customer@123` | Active Island Kitchen project (Stage 8/14 Manufacturing). |
| **Customer** | `customer.verma@gmail.com` | `Customer@123` | Parallel Kitchen inquiry in Design stage (Stage 3/14). |

---

## 5. Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v22 recommended)
- [PostgreSQL](https://www.postgresql.org/) (local or cloud instance e.g., Railway, Supabase, Neon)

### 1. Clone & Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env to set your PostgreSQL connection URL
```

### 2. Initialize Database & Seed Data
```bash
# Push schema and generate Prisma client
npx prisma db push
npx prisma generate

# Seed sample data (users, projects, stages, quotations, payments, inventory)
npm run seed
```

### 3. Start Backend Server
```bash
npm run dev
# Backend starts at http://localhost:5000
# Health check available at: http://localhost:5000/api/health
```

### 4. Setup & Start Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
# Frontend boots at http://localhost:5173
```

---

## 6. Running Tests

The test suite validates authentication, RBAC authorization, customer tenant isolation, 14-stage progression logic, inventory stock reservation, PDF quotation streaming, and enterprise staff analytics:

```bash
cd backend
npm test
```

Test Results:
- **6 Test Suites Passed** (`auth.test.js`, `crm.test.js`, `project.test.js`, `design-quotation.test.js`, `payment-inventory.test.js`, `enterprise.test.js`)
- **21 Passing Integration Tests**

---

## 7. Cloud Deployment Guide

### A. Deploy Backend to Railway
1. Create a new project on [Railway](https://railway.app/).
2. Add a **PostgreSQL** database service.
3. Add a new service from your GitHub repository (pointing to `/backend`).
4. Set the environment variables in Railway:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET`: Generate a strong 64-character secret.
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your deployed Vercel frontend domain.
5. Railway automatically utilizes `backend/railway.json` and `backend/Procfile` to run database migrations and boot the server.

### B. Deploy Frontend to Vercel
1. Import the repository on [Vercel](https://vercel.com/).
2. Set root directory to `frontend`.
3. Framework Preset: **Vite**.
4. Configure environment variables:
   - `VITE_API_URL`: `https://<YOUR-RAILWAY-BACKEND>.up.railway.app/api`
   - `VITE_SOCKET_URL`: `https://<YOUR-RAILWAY-BACKEND>.up.railway.app`
5. Vercel utilizes `frontend/vercel.json` for client-side SPA routing and security headers.
