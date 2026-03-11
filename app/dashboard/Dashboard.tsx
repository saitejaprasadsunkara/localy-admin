// app/dashboard/page.tsx (Dashboard Component)
/**
 * Admin Dashboard
 * Shows verification stats and quick actions
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { getCurrentAdminUser, isSuperAdminUser } from "../../lib/auth";
import toast from "react-hot-toast";

interface DashboardStats {
  pendingSellers: number;
  pendingDrivers: number;
  pendingDeliveryAgents: number;
  approvalsToday: number;
  adminName: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get current admin user
      const adminUser = await getCurrentAdminUser();

      if (!adminUser) {
        router.push("/auth/login");
        return;
      }

      // Check if super admin
      const isSuperAdminUser_ = await isSuperAdminUser(
        auth.currentUser?.uid || ""
      );
      setIsSuperAdmin(isSuperAdminUser_);

      // TODO: Fetch real stats from Firestore
      const mockStats: DashboardStats = {
        pendingSellers: 5,
        pendingDrivers: 3,
        pendingDeliveryAgents: 2,
        approvalsToday: 12,
        adminName:
          (adminUser as { name?: string; email?: string | null }).name ||
          adminUser.email?.split("@")[0] ||
          "Admin",
      };

      setStats(mockStats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {stats?.adminName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here what happening with your verifications today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sellers Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🏪</div>
            <span className="text-2xl font-bold text-yellow-500">
              {stats?.pendingSellers}
            </span>
          </div>
          <h3 className="text-gray-700 font-semibold mb-2">Pending Sellers</h3>
          <p className="text-sm text-gray-600 mb-4">
            Awaiting verification review
          </p>
          <Link
            href="/dashboard/sellers"
            className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
          >
            Review Sellers →
          </Link>
        </div>

        {/* Drivers Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🚗</div>
            <span className="text-2xl font-bold text-blue-500">
              {stats?.pendingDrivers}
            </span>
          </div>
          <h3 className="text-gray-700 font-semibold mb-2">Pending Drivers</h3>
          <p className="text-sm text-gray-600 mb-4">
            Awaiting verification review
          </p>
          <Link
            href="/dashboard/drivers"
            className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
          >
            Review Drivers →
          </Link>
        </div>

        {/* Delivery Agents Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🚴</div>
            <span className="text-2xl font-bold text-purple-500">
              {stats?.pendingDeliveryAgents}
            </span>
          </div>
          <h3 className="text-gray-700 font-semibold mb-2">
            Pending Delivery Agents
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Awaiting verification review
          </p>
          <Link
            href="/dashboard/delivery-agents"
            className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
          >
            Review Agents →
          </Link>
        </div>

        {/* Approvals Today Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">✅</div>
            <span className="text-2xl font-bold text-green-500">
              {stats?.approvalsToday}
            </span>
          </div>
          <h3 className="text-gray-700 font-semibold mb-2">Approvals Today</h3>
          <p className="text-sm text-gray-600 mb-4">
            Total approvals this session
          </p>
          <Link
            href="/dashboard/audit-logs"
            className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
          >
            View Audit Logs →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/sellers"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <span className="text-2xl">🏪</span>
            <div>
              <p className="font-semibold text-gray-900">Review Sellers</p>
              <p className="text-sm text-gray-600">Verify seller accounts</p>
            </div>
          </Link>

          <Link
            href="/dashboard/drivers"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <span className="text-2xl">🚗</span>
            <div>
              <p className="font-semibold text-gray-900">Review Drivers</p>
              <p className="text-sm text-gray-600">Verify driver accounts</p>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-semibold text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">See performance metrics</p>
            </div>
          </Link>

          {isSuperAdmin && (
            <Link
              href="/dashboard/admin-manage"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <span className="text-2xl">👨‍💼</span>
              <div>
                <p className="font-semibold text-gray-900">Manage Admins</p>
                <p className="text-sm text-gray-600">Create/edit admins</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900 font-semibold mb-2">💡 Pro Tip</p>
        <p className="text-blue-800 text-sm">
          All of your actions are being logged to the audit trail for compliance
          and transparency. You can view the complete history in the Audit Logs
          section.
        </p>
      </div>
    </div>
  );
}
