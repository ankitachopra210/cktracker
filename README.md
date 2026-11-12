# CKTracker — Production Modular Kitchen Business Management System

CKTracker is a comprehensive, production-grade business management SaaS application designed specifically for modular kitchen manufacturers, studios, and interior turnkey businesses. It tracks the complete customer lifecycle across **14 distinct engineering, design, manufacturing, and installation stages** with role-based dashboards for **Admin**, **Manager**, and **Customer**.

---

## 1. System Architecture

```
[ React + Vite + Tailwind CSS ]
           │ (REST + WebSockets)
           ▼
[ Express.js Modular Monolith Backend ]
  ├── Auth & RBAC Security Layer (JWT, bcrypt, Ownership Guard)
  ├── 14-Stage Project Lifecycle Engine
  ├── 2D/3D Kitchen Design & Customer Approval Service
  ├── Itemized Quotation & PDFKit Invoicing Engine
  ├── Raw Material Inventory & Supplier Procurement Service
  ├── Socket.IO Real-Time Stage Event Broadcaster
  └── Nodemailer Notification Adapter
           │ (Prisma ORM)
           ▼
[ PostgreSQL Relational Database ] (26 Normalized Models)
```

---

## 2. Default 14-Stage Modular Kitchen Lifecycle

1. **Customer Registration & Requirements Gathering**
2. **Site Measurement & Technical Survey** (laser wall survey, plumbing, electrical)
3. **2D Layout & 3D Kitchen Design Preparation**
4. **Customer Design Presentation & Approval** (client digital sign-off)
5. **Quotation Preparation & Cost Estimation** (carcass, shutters, hardware, countertop, GST)
6. **Quotation Approval & Advance Payment** (50% production advance)
7. **Raw Material Procurement & Stock Allocation** (marine ply, acrylic sheets, Blum/Hettich hardware)
8. **Factory Manufacturing & CNC Edge Banding** (precision panel sizing & PUR banding)
9. **Factory Quality Inspection (QC Audit)** (shutter alignment & tolerance verification)
10. **Protective Packaging & Site Dispatch**
11. **On-Site Modular Installation** (carcass leveling, countertop cutout, sink & hob fitting)
12. **Final Inspection & Snag List Rectification**
13. **Customer Handover & Sign-Off**
14. **Project Completed & Warranty Activation** (10-year hardware warranty certificate)

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Multer, Helmet, Morgan, Joi validation, PDFKit.
- **Database & ORM**: PostgreSQL, Prisma ORM.
- **Real-Time & Communications**: Socket.IO, Nodemailer, Modular WhatsApp adapter.
- **Testing**: Jest, Supertest.

---

## 4. User Roles & Default Test Credentials

| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cktracker.com` | `Admin@123` | Complete business oversight: financial audits, employee admin, inventory, all projects, analytics. |
| **Manager** | `manager.rahul@cktracker.com` | `Manager@123` | Customer CRM, leads, site measurements, assigned projects, stage progression, photo logs. |
| **Designer** | `designer.priya@cktracker.com` | `Designer@123` | 2D/3D kitchen layout uploads, material specs, customer modification requests. |
| **Customer** | `customer.sharma@gmail.com` | `Customer@123` | Personal kitchen tracker (Stage 8/14), 3D render approval, quotation viewing, payment receipts. |
| **Customer** | `customer.verma@gmail.com` | `Customer@123` | Personal kitchen tracker (Stage 3/14), Scandinavian parallel kitchen inquiry. |

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL database instance (local or hosted on Railway / Supabase / Neon)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Configure your DATABASE_URL in .env, then generate Prisma client & push schema:
npx prisma generate
npx prisma db push

# Seed with enterprise test data:
npm run seed

# Run backend development server:
npm run dev
# Server boots at http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend boots at http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd backend
npm test
```
