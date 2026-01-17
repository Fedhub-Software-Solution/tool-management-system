# Database Seeding Guide

This guide explains how to populate the database with sample data for testing and development.

## Overview

The seed script creates comprehensive sample data including:
- **5 Users** (one for each role: Approver, NPD, Maintenance, Spares, Indentor)
- **4 Projects** (Active, OnHold, Completed)
- **4 Suppliers** (3 Active, 1 Inactive)
- **3 Purchase Requisitions** (with items and critical spares)
- **3 Quotations** (Pending, Selected, Rejected)
- **2 Tool Handovers** (Approved, Pending Inspection)
- **5 Inventory Items** (InStock, LowStock, OutOfStock)
- **5 Spares Requests** (Pending, Fulfilled, Partially Fulfilled, Rejected)
- **6 Notifications** (various types and statuses)
- **Stock Transactions** (for inventory history)

## Prerequisites

1. Database must be set up and migrations run
2. Environment variables configured (`.env` file)
3. Dependencies installed (`npm install`)

## Running the Seed Script

### Option 1: Using npm script (Recommended)

```bash
npm run prisma:seed
```

### Option 2: Using Prisma directly

```bash
npx prisma db seed
```

### Option 3: Direct execution

```bash
npx tsx prisma/seed.ts
```

## Important Notes

⚠️ **Warning**: The seed script **clears all existing data** before seeding. This is intentional for development/testing but should **NEVER** be run in production!

If you want to keep existing data, comment out the deletion section in `prisma/seed.ts`:

```typescript
// Comment out these lines if you want to keep existing data
// await prisma.stockTransaction.deleteMany();
// await prisma.sparesRequest.deleteMany();
// ... etc
```

## Login Credentials

After seeding, you can login with any of these users:

| Role | Email | Password |
|------|-------|----------|
| Approver | `approver@toolmgmt.com` | `Password@123` |
| NPD | `npd@toolmgmt.com` | `Password@123` |
| Maintenance | `maintenance@toolmgmt.com` | `Password@123` |
| Spares | `spares@toolmgmt.com` | `Password@123` |
| Indentor | `indentor@toolmgmt.com` | `Password@123` |

## Sample Data Details

### Projects
- **PROJ-2024-001**: Production Line A Expansion (Active)
- **PROJ-2024-002**: Quality Improvement Initiative (Active)
- **PROJ-2024-003**: Maintenance Overhaul (OnHold)
- **PROJ-2023-001**: Completed Project Alpha (Completed)

### Purchase Requisitions
- **PR-2024-001**: Approved PR with items and quotations
- **PR-2024-002**: Submitted PR awaiting approval
- **PR-2024-003**: Approved PR for quality improvement

### Inventory Items
- **InStock**: Injection Mold Cavity, Ejection System, Quality Control Gauge
- **LowStock**: Spare Part - Cooling Fan (below minimum)
- **OutOfStock**: Out of Stock Item (0 stock)

### Spares Requests
- **REQ-2024-001**: Fulfilled request
- **REQ-2024-002**: Fulfilled request
- **REQ-2024-003**: Partially fulfilled request
- **REQ-2024-004**: Pending request
- **REQ-2024-005**: Rejected request

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```bash
npm install
npx prisma generate
```

### Error: "Database connection failed"
- Check your `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Verify database exists

### Error: "Foreign key constraint failed"
- Make sure migrations are up to date: `npm run prisma:migrate`
- The seed script deletes data in the correct order to avoid FK issues

## Resetting the Database

To completely reset and reseed:

```bash
# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Run the seed script automatically
```

## Customizing Seed Data

To customize the seed data, edit `prisma/seed.ts`. You can:
- Add more users
- Create additional projects
- Add more suppliers
- Create more PRs and quotations
- Adjust inventory levels
- Add more notifications

Remember to maintain data relationships (foreign keys) when adding new data.

