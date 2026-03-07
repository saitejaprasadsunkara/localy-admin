// app/dashboard/audit-logs/page.tsx
"use client";

import React, { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  actionType:
    | "approval"
    | "rejection"
    | "admin_management"
    | "login"
    | "data_access";
  targetType: string;
  targetName: string;
  timestamp: Date;
  status: "success" | "failed";
  details?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      // TODO: Replace with real Firestore query
      const mockLogs: AuditLog[] = [
        {
          id: "1",
          adminName: "Priya Sharma",
          adminEmail: "priya@locly.app",
          action: "Approved Seller",
          actionType: "approval",
          targetType: "seller",
          targetName: "Rajesh Restaurant",
          timestamp: new Date("2024-03-06 14:30"),
          status: "success",
          details: "All documents verified and approved",
        },
        {
          id: "2",
          adminName: "Rajesh Kumar",
          adminEmail: "rajesh@locly.app",
          action: "Rejected Driver",
          actionType: "rejection",
          targetType: "driver",
          targetName: "Vikram Patel",
          timestamp: new Date("2024-03-06 13:45"),
          status: "success",
          details: "License expired - valid until 2023",
        },
        {
          id: "3",
          adminName: "Priya Sharma",
          adminEmail: "priya@locly.app",
          action: "Logged In",
          actionType: "login",
          targetType: "system",
          targetName: "Admin Portal",
          timestamp: new Date("2024-03-06 09:15"),
          status: "success",
        },
        {
          id: "4",
          adminName: "Admin System",
          adminEmail: "system@locly.app",
          action: "Created Admin",
          actionType: "admin_management",
          targetType: "admin",
          targetName: "Ananya Singh",
          timestamp: new Date("2024-03-05 16:20"),
          status: "success",
          details: "New admin account created with moderator role",
        },
        {
          id: "5",
          adminName: "Rajesh Kumar",
          adminEmail: "rajesh@locly.app",
          action: "Approved Delivery Agent",
          actionType: "approval",
          targetType: "delivery_agent",
          targetName: "Rohit Singh",
          timestamp: new Date("2024-03-05 15:50"),
          status: "success",
          details: "All verification documents submitted and verified",
        },
        {
          id: "6",
          adminName: "Priya Sharma",
          adminEmail: "priya@locly.app",
          action: "Exported Audit Logs",
          actionType: "data_access",
          targetType: "audit_log",
          targetName: "Audit Report",
          timestamp: new Date("2024-03-05 14:30"),
          status: "success",
          details: "Exported 100 logs to CSV format",
        },
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.actionType === filter;
    const matchesSearch =
      log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "approval":
        return "bg-green-100 text-green-800";
      case "rejection":
        return "bg-red-100 text-red-800";
      case "admin_management":
        return "bg-purple-100 text-purple-800";
      case "login":
        return "bg-blue-100 text-blue-800";
      case "data_access":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "approval":
        return "✅";
      case "rejection":
        return "❌";
      case "admin_management":
        return "👨‍💼";
      case "login":
        return "🔐";
      case "data_access":
        return "📊";
      default:
        return "📝";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "success" ? "✓" : "✗";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-600">
            Track all admin actions for compliance and transparency
          </p>
        </div>
        <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
          📥 Export Logs (CSV)
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by admin, action, or target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "All", value: "all" },
              { label: "Approvals", value: "approval" },
              { label: "Rejections", value: "rejection" },
              { label: "Admin Actions", value: "admin_management" },
              { label: "Logins", value: "login" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  filter === option.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Actions</p>
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Approvals</p>
          <p className="text-2xl font-bold text-green-500">
            {logs.filter((l) => l.actionType === "approval").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Rejections</p>
          <p className="text-2xl font-bold text-red-500">
            {logs.filter((l) => l.actionType === "rejection").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Success Rate</p>
          <p className="text-2xl font-bold text-blue-500">
            {(
              (logs.filter((l) => l.status === "success").length /
                logs.length) *
              100
            ).toFixed(1)}
            %
          </p>
        </div>
      </div>

      {/* Logs List */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {getActionIcon(log.actionType)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {log.action}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(
                            log.actionType
                          )}`}
                        >
                          {log.actionType.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            log.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {getStatusIcon(log.status)} {log.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        By <span className="font-medium">{log.adminName}</span>{" "}
                        on <span className="font-medium">{log.targetName}</span>
                      </p>
                      {log.details && (
                        <p className="text-sm text-gray-500 mt-1">
                          📝 {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-sm text-gray-600 font-medium">
                    {log.timestamp.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{log.adminEmail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No audit logs found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      )}

      {/* Compliance Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900 font-semibold mb-2">
          🔒 Audit Log Information
        </p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>✅ All admin actions are logged automatically</li>
          <li>
            ✅ Logs include timestamp, admin name, action type, and status
          </li>
          <li>✅ Logs are immutable and cannot be edited or deleted</li>
          <li>✅ You can export logs for compliance and auditing purposes</li>
          <li>✅ Logs are retained for 2 years for compliance requirements</li>
        </ul>
      </div>
    </div>
  );
}
