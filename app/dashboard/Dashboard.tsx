// app/dashboard/Dashboard.tsx
/**
 * Admin Dashboard
 * Real Firestore stats: pending verifications, delivery tracking, approvals today
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { getCurrentAdminUser, isSuperAdminUser } from "../../lib/auth";
import toast from "react-hot-toast";

interface DashboardStats {
  pendingSellers: number;
  pendingDrivers: number;
  pendingDeliveryAgents: number;
  approvalsToday: number;
  rejectionsToday: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  totalVerified: number;
  adminName: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      const adminUser = await getCurrentAdminUser();
      if (!adminUser) {
        router.push("/auth/login");
        return;
      }

      const isSA = await isSuperAdminUser(auth.currentUser?.uid || "");
      setIsSuperAdmin(isSA);

      const adminName =
        (adminUser as { name?: string; email?: string | null }).name ||
        adminUser.email?.split("@")[0] ||
        "Admin";

      // ─── Today boundaries ──────────────────────────────────────
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartTs = Timestamp.fromDate(todayStart);

      // ─── Pending verifications by role ────────────────────────
      const verRef = collection(db, "verificationRequests");

      const [
        pendingSellersSnap,
        pendingDriversSnap,
        pendingAgentsSnap,
        approvedTodaySnap,
        rejectedTodaySnap,
        totalVerifiedSnap,
      ] = await Promise.all([
        getCountFromServer(
          query(
            verRef,
            where("userRole", "==", "seller"),
            where("status", "in", ["pending", "under_review"])
          )
        ),
        getCountFromServer(
          query(
            verRef,
            where("userRole", "==", "driver"),
            where("status", "in", ["pending", "under_review"])
          )
        ),
        getCountFromServer(
          query(
            verRef,
            where("userRole", "==", "delivery_agent"),
            where("status", "in", ["pending", "under_review"])
          )
        ),
        getCountFromServer(
          query(
            verRef,
            where("status", "==", "verified"),
            where("reviewedAt", ">=", todayStartTs)
          )
        ),
        getCountFromServer(
          query(
            verRef,
            where("status", "==", "rejected"),
            where("reviewedAt", ">=", todayStartTs)
          )
        ),
        getCountFromServer(query(verRef, where("status", "==", "verified"))),
      ]);

      // ─── Delivery tracking from orders collection ──────────────
      let successfulDeliveries = 0;
      let failedDeliveries = 0;

      try {
        const ordersRef = collection(db, "orders");
        const [successSnap, failedSnap] = await Promise.all([
          getCountFromServer(
            query(ordersRef, where("deliveryStatus", "==", "delivered"))
          ),
          getCountFromServer(
            query(
              ordersRef,
              where("deliveryStatus", "in", ["failed", "cancelled"])
            )
          ),
        ]);
        successfulDeliveries = successSnap.data().count;
        failedDeliveries = failedSnap.data().count;
      } catch {
        // orders collection may not exist yet — fallback to 0
      }

      setStats({
        pendingSellers: pendingSellersSnap.data().count,
        pendingDrivers: pendingDriversSnap.data().count,
        pendingDeliveryAgents: pendingAgentsSnap.data().count,
        approvalsToday: approvedTodaySnap.data().count,
        rejectionsToday: rejectedTodaySnap.data().count,
        successfulDeliveries,
        failedDeliveries,
        totalVerified: totalVerifiedSnap.data().count,
        adminName,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

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

  const deliveryTotal =
    (stats?.successfulDeliveries ?? 0) + (stats?.failedDeliveries ?? 0);
  const successRate =
    deliveryTotal > 0
      ? Math.round(
          ((stats?.successfulDeliveries ?? 0) / deliveryTotal) * 100
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {stats?.adminName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s what&apos;s happening on Localy today.
        </p>
      </div>

      {/* ── Pending Verifications ─────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Pending Verifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Sellers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🏪</div>
              <span className="text-2xl font-bold text-yellow-500">
                {stats?.pendingSellers ?? 0}
              </span>
            </div>
            <h3 className="text-gray-700 font-semibold mb-1">Pending Sellers</h3>
            <p className="text-sm text-gray-500 mb-4">Awaiting review</p>
            <Link
              href="/dashboard/sellers"
              className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
            >
              Review Sellers →
            </Link>
          </div>

          {/* Drivers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🚗</div>
              <span className="text-2xl font-bold text-blue-500">
                {stats?.pendingDrivers ?? 0}
              </span>
            </div>
            <h3 className="text-gray-700 font-semibold mb-1">Pending Drivers</h3>
            <p className="text-sm text-gray-500 mb-4">Awaiting review</p>
            <Link
              href="/dashboard/drivers"
              className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
            >
              Review Drivers →
            </Link>
          </div>

          {/* Delivery Agents */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🚴</div>
              <span className="text-2xl font-bold text-purple-500">
                {stats?.pendingDeliveryAgents ?? 0}
              </span>
            </div>
            <h3 className="text-gray-700 font-semibold mb-1">
              Pending Agents
            </h3>
            <p className="text-sm text-gray-500 mb-4">Awaiting review</p>
            <Link
              href="/dashboard/delivery-agents"
              className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
            >
              Review Agents →
            </Link>
          </div>

          {/* Total Verified */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">✅</div>
              <span className="text-2xl font-bold text-green-500">
                {stats?.totalVerified ?? 0}
              </span>
            </div>
            <h3 className="text-gray-700 font-semibold mb-1">Total Verified</h3>
            <p className="text-sm text-gray-500 mb-4">All time approvals</p>
            <Link
              href="/dashboard/approved-agents"
              className="text-orange-500 hover:text-orange-600 text-sm font-semibold"
            >
              View Approved →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Today's Activity ──────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Today&apos;s Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                👍
              </div>
              <div>
                <p className="text-3xl font-bold text-green-700">
                  {stats?.approvalsToday ?? 0}
                </p>
                <p className="text-green-600 font-medium">Approvals Today</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                👎
              </div>
              <div>
                <p className="text-3xl font-bold text-red-700">
                  {stats?.rejectionsToday ?? 0}
                </p>
                <p className="text-red-600 font-medium">Rejections Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery Tracking ─────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Delivery Tracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Successful */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.successfulDeliveries ?? 0}
                </p>
                <p className="text-sm text-gray-500">Successful Deliveries</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${successRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{successRate}% success rate</p>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl">❌</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.failedDeliveries ?? 0}
                </p>
                <p className="text-sm text-gray-500">Failed / Cancelled</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full transition-all"
                style={{
                  width: `${deliveryTotal > 0 ? 100 - successRate : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {deliveryTotal > 0 ? 100 - successRate : 0}% failure rate
            </p>
          </div>

          {/* Total */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🚚</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {deliveryTotal}
                </p>
                <p className="text-sm text-gray-500">Total Deliveries</p>
              </div>
            </div>
            <Link
              href="/dashboard/analytics"
              className="inline-block mt-2 text-sm text-orange-500 hover:text-orange-600 font-semibold"
            >
              View Analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/documents"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <span className="text-2xl">📄</span>
            <div>
              <p className="font-semibold text-gray-900">View Documents</p>
              <p className="text-sm text-gray-600">Review uploaded docs</p>
            </div>
          </Link>

          <Link
            href="/dashboard/approved-agents"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-900">Approved Agents</p>
              <p className="text-sm text-gray-600">All verified accounts</p>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-semibold text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Performance metrics</p>
            </div>
          </Link>

          {isSuperAdmin && (
            <Link
              href="/dashboard/admin-management"
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

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900 font-semibold mb-1">💡 Pro Tip</p>
        <p className="text-blue-800 text-sm">
          All actions are logged to the audit trail for compliance. Check the
          Documents page to review uploaded verification files from sellers,
          drivers, and delivery agents.
        </p>
      </div>
    </div>
  );
}
