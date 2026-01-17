# Login Credentials for Testing

## All User Accounts

All users share the same password: **`Password@123`**

### 1. Approver
- **Email**: `approver@toolmgmt.com`
- **Password**: `Password@123`
- **Role**: Approver
- **Permissions**: Project creation, PR approval, user management, supplier management

### 2. NPD (New Product Development)
- **Email**: `npd@toolmgmt.com`
- **Password**: `Password@123`
- **Role**: NPD
- **Permissions**: PR creation, quotation management, tool handover initiation

### 3. Maintenance
- **Email**: `maintenance@toolmgmt.com`
- **Password**: `Password@123`
- **Role**: Maintenance
- **Permissions**: Tool handover inspection and approval

### 4. Spares
- **Email**: `spares@toolmgmt.com`
- **Password**: `Password@123`
- **Role**: Spares
- **Permissions**: Inventory management, spares request fulfillment

### 5. Indentor
- **Email**: `indentor@toolmgmt.com`
- **Password**: `Password@123`
- **Role**: Indentor
- **Permissions**: Create spares requests, view inventory

---

## Sample Data Summary

### Projects
- **PROJ-2024-001**: Production Line A Expansion (Active)
- **PROJ-2024-002**: Quality Improvement Initiative (Active)
- **PROJ-2024-003**: Maintenance Overhaul (OnHold)
- **PROJ-2023-001**: Completed Project Alpha (Completed)

### Purchase Requisitions
- **PR-2024-001**: Approved PR with items and quotations
- **PR-2024-002**: Submitted PR awaiting approval
- **PR-2024-003**: Approved PR for quality improvement

### Suppliers
- **SUP-001**: Precision Tools Inc. (Active)
- **SUP-002**: Advanced Manufacturing Co. (Active)
- **SUP-003**: Quality Materials Ltd. (Active)
- **SUP-004**: Elite Tooling Solutions (Inactive)

### Quotations
- **QUO-2024-001**: Selected quotation from Precision Tools Inc.
- **QUO-2024-002**: Rejected quotation from Advanced Manufacturing Co.
- **QUO-2024-003**: Pending quotation from Precision Tools Inc.

### Tool Handovers
- **HAND-2024-001**: Approved handover for Production Line A
- **HAND-2024-002**: Pending inspection handover

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

### Notifications
- 6 notifications created for various events (PR created, approved, quotation received, handover pending, low stock, request created)

---

## Testing Workflow

1. **Login as Approver** → Create projects, approve PRs
2. **Login as NPD** → Create PRs, manage quotations, initiate handovers
3. **Login as Maintenance** → Inspect and approve handovers
4. **Login as Spares** → Manage inventory, fulfill requests
5. **Login as Indentor** → Create spares requests, view inventory

---

## Notes

- All passwords are set to `Password@123` for easy testing
- Change passwords in production environment
- Sample data includes various statuses for comprehensive testing
- All relationships and foreign keys are properly maintained

