// components/verification/ApprovalModal.tsx
"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

interface ApprovalModalProps {
  isOpen: boolean;
  title: string;
  name: string;
  onConfirm: (notes: string) => Promise<void>;
  onCancel: () => void;
}

export default function ApprovalModal({
  isOpen,
  title,
  name,
  onConfirm,
  onCancel,
}: ApprovalModalProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onConfirm(notes);
      toast.success(`${name} approved successfully!`);
      setNotes("");
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 text-sm mt-1">
            You are approving <span className="font-semibold">{name}</span>
          </p>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this approval..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={4}
          />
        </div>

        {/* Alert Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-900 text-sm font-medium">
            ✅ This action cannot be undone. Make sure all documents are
            verified.
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
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Approving...
              </>
            ) : (
              <>
                <span>✅</span>
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
