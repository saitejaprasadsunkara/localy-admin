// types/index.ts

/**
 * USER TYPES
 */
export type UserRole =
  | "user"
  | "seller"
  | "driver"
  | "delivery_agent"
  | "admin"
  | "super_admin";

export interface User {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  verificationStatus?: "none" | "pending" | "verified" | "rejected";
}

/**
 * ADMIN TYPES
 */
export type AdminRole = "super_admin" | "admin" | "moderator";
export type AdminStatus = "active" | "inactive" | "suspended";

export interface AdminPermissions {
  canApproveSellers: boolean;
  canApproveDrivers: boolean;
  canApproveDeliveryAgents: boolean;
  canManageAdmins: boolean;
  canViewAnalytics: boolean;
  canViewAuditLogs: boolean;
  canConfigureRules: boolean;
  canManageContent: boolean;
  canHandleDisputes: boolean;
}

export interface Admin extends Omit<User, "role"> {
  role: AdminRole;
  status: AdminStatus;
  permissions: AdminPermissions;
  isOnline: boolean;
  lastLogin?: Date;
  lastActivity?: Date;
  createdBy?: string;
  stats?: {
    totalApprovalsToday: number;
    totalRejectionsToday: number;
    totalApprovalsThisMonth: number;
    totalRejectionsThisMonth: number;
    averageApprovalTime: number;
  };
}

export interface AdminSession {
  sessionId: string;
  adminId: string;
  adminName: string;
  loginTime: Date;
  logoutTime?: Date;
  sessionDuration?: number;
  isActive: boolean;
  status: "active" | "idle" | "logged_out" | "expired";
}

/**
 * VERIFICATION TYPES
 */
export type VerificationType = "seller" | "driver" | "delivery_agent";
export type VerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

export interface VerificationDocument {
  url: string;
  uploadedAt: Date;
  type: "image" | "pdf";
  number?: string;
  expiryDate?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userRole: VerificationType;
  email: string;
  phone: string;
  businessName?: string;
  businessAddress?: string;
  status: VerificationStatus;
  documents: Record<string, VerificationDocument>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

/**
 * SELLER VERIFICATION
 */
export interface SellerVerification extends VerificationRequest {
  sellerType?: "restaurant" | "home_chef" | "farmer" | "grocery" | "artisan";
  fssai?: VerificationDocument;
  gst?: VerificationDocument;
  panCard?: VerificationDocument;
}

/**
 * DRIVER VERIFICATION
 */
export interface DriverVerification extends VerificationRequest {
  drivingLicense?: VerificationDocument;
  vehicleRC?: VerificationDocument;
  vehicleInsurance?: VerificationDocument;
  aadhar?: VerificationDocument;
  panCard?: VerificationDocument;
}

/**
 * DELIVERY AGENT VERIFICATION
 */
export interface DeliveryAgentVerification extends VerificationRequest {
  drivingLicense?: VerificationDocument;
  aadhar?: VerificationDocument;
  panCard?: VerificationDocument;
  backgroundCheck?: VerificationDocument;
}

/**
 * AUDIT LOG TYPES
 */
export type AuditAction =
  | "login"
  | "logout"
  | "created_admin"
  | "deleted_admin"
  | "edited_admin"
  | "approved_seller"
  | "approved_driver"
  | "approved_delivery_agent"
  | "rejected_seller"
  | "rejected_driver"
  | "rejected_delivery_agent"
  | "viewed_documents"
  | "exported_data"
  | "changed_settings";

export type AuditActionType =
  | "approval"
  | "rejection"
  | "admin_management"
  | "login"
  | "data_access"
  | "settings";

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: AuditAction;
  actionType: AuditActionType;
  targetType?: "seller" | "driver" | "delivery_agent" | "admin" | "user";
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  status: "success" | "failed";
  errorMessage?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

/**
 * ANALYTICS TYPES
 */
export interface AdminStats {
  adminId: string;
  date: string;
  sellersApproved: number;
  driversApproved: number;
  deliveryAgentsApproved: number;
  sellersRejected: number;
  driversRejected: number;
  deliveryAgentsRejected: number;
  totalMinutesOnline: number;
  lastActions?: {
    timestamp: Date;
    action: string;
    target: string;
  }[];
}

export interface AnalyticsDashboard {
  totalPendingApprovals: number;
  totalApprovedToday: number;
  totalRejectedToday: number;
  averageApprovalTime: number;
  adminPerformance: AdminStats[];
  approvalTrend: {
    date: string;
    approved: number;
    rejected: number;
  }[];
}

/**
 * API RESPONSE TYPES
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * DASHBOARD TYPES
 */
export interface DashboardStats {
  pendingSellers: number;
  pendingDrivers: number;
  pendingDeliveryAgents: number;
  totalPending: number;
  approvalsToday: number;
  rejectionsToday: number;
  adminName: string;
  adminRole: AdminRole;
}
