// Application constants
export const ROLES = {
  APPROVER: 'Approver',
  NPD: 'NPD',
  MAINTENANCE: 'Maintenance',
  SPARES: 'Spares',
  INDENTOR: 'Indentor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Project statuses
export const PROJECT_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
} as const;

// PR statuses
export const PR_STATUS = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SENT_TO_SUPPLIER: 'Sent To Supplier',
  EVALUATION_PENDING: 'Evaluation Pending',
  AWARDED: 'Awarded',
  ITEMS_RECEIVED: 'Items Received',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

