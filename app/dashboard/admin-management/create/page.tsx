// app/dashboard/admin-management/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "moderator";
  status: "active" | "inactive" | "suspended";
  permissions: {
    canApproveSellers: boolean;
    canApproveDrivers: boolean;
    canApproveDeliveryAgents: boolean;
    canViewAnalytics: boolean;
    canViewAuditLogs: boolean;
  };
  createdAt: Date;
  createdBy: string;
  stats: {
    totalApprovalsThisMonth: number;
    totalRejectionsThisMonth: number;
    averageApprovalTime: number;
  };
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      // TODO: Replace with real Firestore query
      const mockAdmins: AdminUser[] = [
        {
          id: "2",
          name: "Priya Sharma",
          email: "priya@locly.app",
          phone: "+91 9876543210",
          role: "admin",
          status: "active",
          permissions: {
            canApproveSellers: true,
            canApproveDrivers: true,
            canApproveDeliveryAgents: true,
            canViewAnalytics: true,
            canViewAuditLogs: true,
          },
          createdAt: new Date("2024-02-01"),
          createdBy: "super_admin",
          stats: {
            totalApprovalsThisMonth: 45,
            totalRejectionsThisMonth: 8,
            averageApprovalTime: 24,
          },
        },
        {
          id: "3",
          name: "Rajesh Kumar",
          email: "rajesh@locly.app",
          phone: "+91 9876543211",
          role: "admin",
          status: "active",
          permissions: {
            canApproveSellers: true,
            canApproveDrivers: true,
            canApproveDeliveryAgents: false,
            canViewAnalytics: true,
            canViewAuditLogs: true,
          },
          createdAt: new Date("2024-02-15"),
          createdBy: "super_admin",
          stats: {
            totalApprovalsThisMonth: 32,
            totalRejectionsThisMonth: 5,
            averageApprovalTime: 18,
          },
        },
        {
          id: "4",
          name: "Ananya Singh",
          email: "ananya@locly.app",
          phone: "+91 9876543212",
          role: "moderator",
          status: "active",
          permissions: {
            canApproveSellers: false,
            canApproveDrivers: false,
            canApproveDeliveryAgents: false,
            canViewAnalytics: true,
            canViewAuditLogs: true,
          },
          createdAt: new Date("2024-03-01"),
          createdBy: "super_admin",
          stats: {
            totalApprovalsThisMonth: 0,
            totalRejectionsThisMonth: 0,
            averageApprovalTime: 0,
          },
        },
      ];

      setAdmins(mockAdmins);
    } catch (error) {
      console.error("Error loading admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    return (
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDelete = async (adminId: string) => {
    if (confirm("Are you sure you want to delete this admin?")) {
      console.log("Deleting admin:", adminId);
      // TODO: Delete from Firestore
    }
  };

  const handleStatusChange = async (adminId: string, newStatus: string) => {
    console.log("Changing admin status:", adminId, newStatus);
    // TODO: Update in Firestore
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage admin accounts
          </p>
        </div>
        <Link
          href="/dashboard/admin-management/create"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          + Create New Admin
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Admins</p>
          <p className="text-2xl font-bold text-orange-500">{admins.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Active Admins</p>
          <p className="text-2xl font-bold text-green-500">
            {admins.filter((a) => a.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Approvals This Month</p>
          <p className="text-2xl font-bold text-blue-500">
            {admins.reduce(
              (acc, a) => acc + a.stats.totalApprovalsThisMonth,
              0
            )}
          </p>
        </div>
      </div>

      {/* Admins List */}
      {filteredAdmins.length > 0 ? (
        <div className="space-y-4">
          {filteredAdmins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold text-orange-600">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {admin.name}
                    </h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="text-sm text-gray-600">{admin.phone}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {admin.role === "admin" ? "🔑 Admin" : "👤 Moderator"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          admin.status === "active"
                            ? "bg-green-100 text-green-800"
                            : admin.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {admin.status === "active"
                          ? "🟢 Active"
                          : admin.status === "inactive"
                          ? "⚪ Inactive"
                          : "🚫 Suspended"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">
                    Created: {admin.createdAt.toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/admin-management/${admin.id}`}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">
                      Approvals This Month
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {admin.stats.totalApprovalsThisMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">
                      Rejections This Month
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {admin.stats.totalRejectionsThisMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Approval Time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {admin.stats.averageApprovalTime}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Permissions:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(admin.permissions).map(
                    ([permission, hasPermission]) => (
                      <div
                        key={permission}
                        className={`px-2 py-1 rounded text-xs font-medium text-center ${
                          hasPermission
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {hasPermission ? "✅" : "❌"}{" "}
                        {permission
                          .replace(/^can/, "")
                          .replace(/([A-Z])/g, " $1")}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No admins found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your search query
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900 font-semibold mb-2">
          💡 Admin Management Tips
        </p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>✅ Super Admin (you) has full control over all admins</li>
          <li>✅ Regular Admins can approve/reject verifications</li>
          <li>✅ Moderators can only view data and handle disputes</li>
          <li>✅ You can suspend admins without deleting their account</li>
          <li>✅ All admin actions are logged in the audit trail</li>
        </ul>
      </div>
    </div>
  );
}
