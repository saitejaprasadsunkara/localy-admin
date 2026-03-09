// components/verification/DriversList.tsx
"use client";

import React, { useState } from "react";
import DocumentViewer from "./DocumentViewer";
import ApprovalModal from "./ApprovalModal";
import RejectionModal from "./RejectionModal";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  documents: Record<string, string>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface DriversListProps {
  drivers: Driver[];
  onApprove: (driverId: string) => Promise<void>;
  onReject: (driverId: string, reason: string) => Promise<void>;
}

export default function DriversList({
  drivers,
  onApprove,
  onReject,
}: DriversListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvalDriver, setApprovalDriver] = useState<string | null>(null);
  const [rejectionDriver, setRejectionDriver] = useState<string | null>(null);

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
      {drivers.map((driver) => (
        <div
          key={driver.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Driver Card Header */}
          <div
            onClick={() =>
              setExpandedId(expandedId === driver.id ? null : driver.id)
            }
            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                    🚗
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {driver.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {driver.vehicleNumber}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 flex-wrap">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      driver.status
                    )}`}
                  >
                    {getStatusLabel(driver.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    📅 {driver.submittedAt.toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    🚗 {driver.vehicleType}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{driver.email}</p>
                <p className="text-sm text-gray-600">{driver.phone}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {expandedId === driver.id ? "▲" : "▼"}
                </p>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === driver.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              {/* Driver Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-medium text-gray-900">{driver.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{driver.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{driver.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
                  <p className="font-medium text-gray-900">
                    {driver.vehicleType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vehicle Number</p>
                  <p className="font-medium text-gray-900">
                    {driver.vehicleNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                  <p className="font-medium text-gray-900">
                    {driver.submittedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <DocumentViewer
                  documents={driver.documents}
                  title="Driver Documents"
                />
              </div>

              {/* Actions */}
              {driver.status === "pending" ||
              driver.status === "under_review" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setApprovalDriver(driver.id)}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setRejectionDriver(driver.id)}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ❌ Reject
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                    💬 Under Review
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-200 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    {driver.status === "verified"
                      ? "✅ Already Verified"
                      : "❌ Rejected"}
                  </p>
                  {driver.rejectionReason && (
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {driver.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modals */}
          <ApprovalModal
            isOpen={approvalDriver === driver.id}
            title="Approve Driver"
            name={driver.name}
            onConfirm={async () => {
              await onApprove(driver.id);
              setApprovalDriver(null);
            }}
            onCancel={() => setApprovalDriver(null)}
          />

          <RejectionModal
            isOpen={rejectionDriver === driver.id}
            title="Reject Driver"
            name={driver.name}
            onConfirm={async (reason) => {
              await onReject(driver.id, reason);
              setRejectionDriver(null);
            }}
            onCancel={() => setRejectionDriver(null)}
          />
        </div>
      ))}
    </div>
  );
}
