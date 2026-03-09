// components/verification/RejectionModal.tsx
"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface RejectionModalProps {
  isOpen: boolean;
  title: string;
  name: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

const REJECTION_REASONS = [
  "Documents expired or invalid",
  "Incomplete documentation",
  "Fraudulent documents detected",
  "Failed background check",
  "Does not meet requirements",
  "Address verification failed",
  "Identity mismatch",
  "Other (specify below)",
];

export default function RejectionModal({
  isOpen,
  title,
  name,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const finalReason =
    selectedReason === "Other (specify below)" ? customReason : selectedReason;
  const isValid = finalReason.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      await onConfirm(finalReason);
      toast.success(`${name} rejected successfully`);
      setSelectedReason("");
      setCustomReason("");
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 text-sm mt-1">
            You are rejecting <span className="font-semibold">{name}</span>
          </p>
        </div>

        {/* Reason Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Rejection Reason *
          </label>
          <div className="space-y-2">
            {REJECTION_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejection-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-red-500"
                />
                <span className="ml-3 text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Reason */}
        {selectedReason === "Other (specify below)" && (
          <div className="mb-6">
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify the reason for rejection..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Alert Box */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-900 text-sm font-medium">
            ⚠️ The applicant will be notified about the rejection reason
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Rejecting...
              </>
            ) : (
              <>
                <span>❌</span>
                Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
