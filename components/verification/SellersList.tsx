// components/verification/SellersList.tsx
"use client";

import React, { useState } from "react";
import DocumentViewer from "./DocumentViewer";
import ApprovalModal from "./ApprovalModal";
import RejectionModal from "./RejectionModal";

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

interface SellersListProps {
  sellers: Seller[];
  onApprove: (sellerId: string, notes?: string) => Promise<void>;
  onReject: (sellerId: string, reason: string) => Promise<void>;
}

export default function SellersList({
  sellers,
  onApprove,
  onReject,
}: SellersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvalSeller, setApprovalSeller] = useState<string | null>(null);
  const [rejectionSeller, setRejectionSeller] = useState<string | null>(null);

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

  const getBusinessTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      restaurant: "🍽️ Restaurant",
      home_chef: "👩‍🍳 Home Chef",
      farmer: "🚜 Farmer",
      grocery: "🛒 Grocery",
      artisan: "🎨 Artisan",
      ride_provider: "🚗 Ride Provider",
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-4">
      {sellers.map((seller) => (
        <div
          key={seller.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Seller Card Header */}
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
                <div className="flex gap-3 mt-2 flex-wrap">
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
                  <span className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {getBusinessTypeLabel(seller.businessType)}
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
              {/* Seller Details */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Seller Information
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">{seller.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{seller.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{seller.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Business Name</p>
                    <p className="font-medium text-gray-900">
                      {seller.businessName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Business Type</p>
                    <p className="font-medium text-gray-900">
                      {getBusinessTypeLabel(seller.businessType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                    <p className="font-medium text-gray-900">
                      {seller.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <DocumentViewer
                  documents={seller.documents}
                  title="Seller Documents"
                />
              </div>

              {/* Actions */}
              {seller.status === "pending" ||
              seller.status === "under_review" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setApprovalSeller(seller.id)}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✅ Approve Seller
                  </button>
                  <button
                    onClick={() => setRejectionSeller(seller.id)}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ❌ Reject Seller
                  </button>
                  <button className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                    💬 Mark Under Review
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-300 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    {seller.status === "verified"
                      ? "✅ Already Verified"
                      : "❌ Rejected"}
                  </p>
                  {seller.rejectionReason && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Reason:</strong> {seller.rejectionReason}
                    </p>
                  )}
                  {seller.reviewedBy && (
                    <p className="text-xs text-gray-600 mt-1">
                      Reviewed by: {seller.reviewedBy}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modals */}
          <ApprovalModal
            isOpen={approvalSeller === seller.id}
            title="Approve Seller"
            name={seller.businessName}
            onConfirm={async (notes: string) => {
              await onApprove(seller.id, notes);
              setApprovalSeller(null);
            }}
            onCancel={() => setApprovalSeller(null)}
          />

          <RejectionModal
            isOpen={rejectionSeller === seller.id}
            title="Reject Seller"
            name={seller.businessName}
            onConfirm={async (reason: string) => {
              await onReject(seller.id, reason);
              setRejectionSeller(null);
            }}
            onCancel={() => setRejectionSeller(null)}
          />
        </div>
      ))}
    </div>
  );
}
