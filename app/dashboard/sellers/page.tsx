// app/dashboard/sellers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
//import SellersList from "./SellersList";

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  documents: Record<string, string>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      // TODO: Replace with real Firestore query
      const mockSellers: Seller[] = [
        {
          id: "1",
          name: "Rajesh Kumar",
          email: "rajesh@seller.com",
          phone: "+91 9876543210",
          businessName: "Rajesh Restaurant",
          businessType: "restaurant",
          status: "pending",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
            fssai: "https://via.placeholder.com/400x300?text=FSSAI",
          },
          submittedAt: new Date("2024-03-05"),
        },
        {
          id: "2",
          name: "Priya Sharma",
          email: "priya@homechef.com",
          phone: "+91 9876543211",
          businessName: "Priya Home Kitchen",
          businessType: "home_chef",
          status: "pending",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
          },
          submittedAt: new Date("2024-03-04"),
        },
        {
          id: "3",
          name: "Arjun Singh",
          email: "arjun@farmer.com",
          phone: "+91 9876543212",
          businessName: "Arjun Organic Farm",
          businessType: "farmer",
          status: "under_review",
          documents: {
            aadhar: "https://via.placeholder.com/400x300?text=Aadhar",
            pan: "https://via.placeholder.com/400x300?text=PAN",
          },
          submittedAt: new Date("2024-03-03"),
          reviewedBy: "admin@locly.app",
        },
      ];

      setSellers(mockSellers);
    } catch (error) {
      console.error("Error loading sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    const matchesFilter = filter === "all" || seller.status === filter;
    const matchesSearch =
      seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = async (sellerId: string) => {
    console.log("Approving seller:", sellerId);
    // TODO: Update in Firestore
  };

  const handleReject = async (sellerId: string, reason: string) => {
    console.log("Rejecting seller:", sellerId, "Reason:", reason);
    // TODO: Update in Firestore
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading sellers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sellers Verification
        </h1>
        <p className="text-gray-600">
          Review and approve/reject seller applications
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {[
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Under Review", value: "under_review" },
              { label: "Verified", value: "verified" },
              { label: "Rejected", value: "rejected" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
          <p className="text-gray-600 text-sm">Total Pending</p>
          <p className="text-2xl font-bold text-orange-500">
            {sellers.filter((s) => s.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Under Review</p>
          <p className="text-2xl font-bold text-blue-500">
            {sellers.filter((s) => s.status === "under_review").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Verified</p>
          <p className="text-2xl font-bold text-green-500">
            {sellers.filter((s) => s.status === "verified").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-500">
            {sellers.filter((s) => s.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Sellers List */}
      {filteredSellers.length > 0 ? (
        <SellersList
          sellers={filteredSellers}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 font-medium">No sellers found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}

// ========================================
// SELLERS LIST COMPONENT
// ========================================

interface SellersListProps {
  sellers: Seller[];
  onApprove: (sellerId: string) => Promise<void>;
  onReject: (sellerId: string, reason: string) => Promise<void>;
}

function SellersList({ sellers, onApprove, onReject }: SellersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(
    null
  );
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(
    null
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "verified":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-4">
      {sellers.map((seller) => (
        <div
          key={seller.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Seller Card */}
          <div
            onClick={() =>
              setExpandedId(expandedId === seller.id ? null : seller.id)
            }
            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                    🏪
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {seller.businessName}
                    </h3>
                    <p className="text-sm text-gray-600">{seller.name}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      seller.status
                    )}`}
                  >
                    {getStatusLabel(seller.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    📅 {seller.submittedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{seller.email}</p>
                <p className="text-sm text-gray-600">{seller.phone}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {expandedId === seller.id ? "▲" : "▼"}
                </p>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === seller.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{seller.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{seller.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Business Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {seller.businessType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                  <p className="font-medium text-gray-900">
                    {seller.submittedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Documents
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(seller.documents).map(([docName, docUrl]) => (
                    <a
                      key={docName}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition-opacity">
                        <img
                          src={docUrl}
                          alt={docName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 capitalize truncate">
                        {docName}
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {seller.status === "pending" ||
              seller.status === "under_review" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApprovalModal(seller.id)}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setShowRejectionModal(seller.id)}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ❌ Reject
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                    💬 Mark Under Review
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-200 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    {seller.status === "verified"
                      ? "✅ Already Verified"
                      : "❌ Rejected"}
                  </p>
                  {seller.rejectionReason && (
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {seller.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Approval Modal */}
          {showApprovalModal === seller.id && (
            <ApprovalModal
              sellerName={seller.businessName}
              onConfirm={() => {
                onApprove(seller.id);
                setShowApprovalModal(null);
              }}
              onCancel={() => setShowApprovalModal(null)}
            />
          )}

          {/* Rejection Modal */}
          {showRejectionModal === seller.id && (
            <RejectionModal
              sellerName={seller.businessName}
              onConfirm={(reason) => {
                onReject(seller.id, reason);
                setShowRejectionModal(null);
              }}
              onCancel={() => setShowRejectionModal(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ========================================
// APPROVAL MODAL COMPONENT
// ========================================

interface ApprovalModalProps {
  sellerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ApprovalModal({
  sellerName,
  onConfirm,
  onCancel,
}: ApprovalModalProps) {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Seller</h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to approve{" "}
          <span className="font-semibold">{sellerName}</span>?
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this seller..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
          >
            ✅ Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// REJECTION MODAL COMPONENT
// ========================================

interface RejectionModalProps {
  sellerName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function RejectionModal({
  sellerName,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Seller</h2>
        <p className="text-gray-600 mb-4">
          Rejecting <span className="font-semibold">{sellerName}</span>. Please
          provide a reason.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you rejecting this seller?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
}
