// app/dashboard/approved-agents/page.tsx
/**
 * Approved Agents
 * Lists all verified accounts (sellers, drivers, delivery agents).
 * Supports category filters, status tabs, and search.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  collection,
  getDocs,
  query,
  where,
  getFirestore,
} from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryFilter = "all" | "seller" | "driver" | "delivery_agent";

interface ApprovedAgent {
  id: string;
  userId: string;
  userRole: CategoryFilter;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  businessAddress?: string;
  sellerType?: string;
  vehicleType?: string;
  status: "verified";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  docCount: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  driver: "Driver",
  delivery_agent: "Delivery Agent",
};

const ROLE_ICONS: Record<string, string> = {
  seller: "🏪",
  driver: "🚗",
  delivery_agent: "🚴",
};

const ROLE_BADGE: Record<string, string> = {
  seller: "bg-orange-100 text-orange-700 border-orange-200",
  driver: "bg-blue-100 text-blue-700 border-blue-200",
  delivery_agent: "bg-purple-100 text-purple-700 border-purple-200",
};

const SELLER_TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  home_chef: "Home Chef",
  farmer: "Farmer",
  grocery: "Grocery",
  artisan: "Artisan",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovedAgentsPage() {
  const [agents, setAgents] = useState<ApprovedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const verRef = collection(db, "verificationRequests");

      let q;
      if (categoryFilter !== "all") {
        q = query(
          verRef,
          where("status", "==", "verified"),
          where("userRole", "==", categoryFilter)
        );
      } else {
        q = query(verRef, where("status", "==", "verified"));
      }

      const snapshot = await getDocs(q);
      const data: ApprovedAgent[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const docs = d.documents ? Object.keys(d.documents).length : 0;

        data.push({
          id: docSnap.id,
          userId: d.userId ?? "",
          userRole: d.userRole ?? "seller",
          name: d.name || d.email?.split("@")[0] || "Unknown",
          email: d.email ?? "",
          phone: d.phone ?? "",
          businessName: d.businessName,
          businessAddress: d.businessAddress,
          sellerType: d.sellerType,
          vehicleType: d.vehicleType,
          status: "verified",
          submittedAt: d.submittedAt?.toDate?.() ?? new Date(),
          reviewedAt: d.reviewedAt?.toDate?.(),
          reviewedBy: d.reviewedBy,
          docCount: docs,
        });
      });

      setAgents(data);
    } catch (error) {
      console.error("Error loading approved agents:", error);
      toast.error("Failed to load approved agents");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // ─── Filter + sort ──────────────────────────────────────────
  const filtered = agents
    .filter((a) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        (a.businessName ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return (b.reviewedAt?.getTime() ?? b.submittedAt.getTime()) -
          (a.reviewedAt?.getTime() ?? a.submittedAt.getTime());
      if (sortBy === "oldest")
        return (a.reviewedAt?.getTime() ?? a.submittedAt.getTime()) -
          (b.reviewedAt?.getTime() ?? b.submittedAt.getTime());
      return a.name.localeCompare(b.name);
    });

  // ─── Counts per category ─────────────────────────────────────
  const counts = {
    all: agents.length,
    seller: agents.filter((a) => a.userRole === "seller").length,
    driver: agents.filter((a) => a.userRole === "driver").length,
    delivery_agent: agents.filter((a) => a.userRole === "delivery_agent").length,
  };

  const categories: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "✅" },
    { key: "seller", label: "Sellers", icon: "🏪" },
    { key: "driver", label: "Drivers", icon: "🚗" },
    { key: "delivery_agent", label: "Delivery Agents", icon: "🚴" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approved Agents</h1>
          <p className="text-gray-500 mt-1">
            {filtered.length} verified account
            {filtered.length !== 1 ? "s" : ""}
            {categoryFilter !== "all"
              ? ` · ${ROLE_LABELS[categoryFilter]}s`
              : ""}
          </p>
        </div>
        <button
          onClick={loadAgents}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              categoryFilter === cat.key
                ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-600"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs ${
                categoryFilter === cat.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[cat.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, email, phone, or business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "oldest" | "name")
            }
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="newest">Sort: Recently Approved</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-gray-500">Loading approved agents...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-600 font-semibold text-lg">
            No approved agents found
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {searchQuery
              ? "Try a different search term."
              : "No verified accounts yet in this category."}
          </p>
        </div>
      )}

      {/* Agent grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-green-300"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700 text-lg">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 leading-tight">
                      {agent.name}
                    </p>
                    <p className="text-xs text-gray-500">{agent.email}</p>
                  </div>
                </div>
                {/* Role badge */}
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    ROLE_BADGE[agent.userRole] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{ROLE_ICONS[agent.userRole]}</span>
                  {ROLE_LABELS[agent.userRole]}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📱</span>
                  <span>{agent.phone || "—"}</span>
                </div>

                {agent.businessName && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🏢</span>
                    <span className="truncate">{agent.businessName}</span>
                  </div>
                )}

                {agent.businessAddress && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">📍</span>
                    <span className="text-xs text-gray-500 line-clamp-2">
                      {agent.businessAddress}
                    </span>
                  </div>
                )}

                {agent.sellerType && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🍽️</span>
                    <span className="text-xs text-orange-600 font-medium">
                      {SELLER_TYPE_LABELS[agent.sellerType] ?? agent.sellerType}
                    </span>
                  </div>
                )}

                {agent.vehicleType && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🚘</span>
                    <span className="capitalize">{agent.vehicleType}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-semibold">
                      ✅ Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-300">📄</span>
                    <span>{agent.docCount} doc{agent.docCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {agent.reviewedAt && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Approved{" "}
                    {agent.reviewedAt.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {agent.reviewedBy ? ` by ${agent.reviewedBy}` : ""}
                  </p>
                )}

                {!agent.reviewedAt && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Submitted{" "}
                    {agent.submittedAt.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      {!loading && agents.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <h3 className="text-green-800 font-semibold mb-3 text-sm">
            Verification Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {categories.map((cat) => (
              <div key={cat.key}>
                <p className="text-2xl font-bold text-green-700">
                  {counts[cat.key]}
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  {cat.icon} {cat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
