// app/dashboard/documents/page.tsx
/**
 * Documents Verification Viewer
 * Shows all uploaded documents from sellers, drivers, and delivery agents.
 * Admins can filter by role & doc type, view full-size images/PDFs, and
 * jump straight to the verification workflow.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { collection, getDocs, query, where, getFirestore } from "firebase/firestore";

// ─── Types ──────────────────────────────────────────────────────────────────

type RoleFilter = "all" | "seller" | "driver" | "delivery_agent";
type StatusFilter = "all" | "pending" | "under_review" | "verified" | "rejected";

interface DocumentEntry {
  docKey: string;       // e.g. "drivingLicense", "fssai"
  url: string;
  fileType: "image" | "pdf" | "unknown";
  uploadedAt: Date | null;
  number?: string;
  expiryDate?: string;
}

interface VerificationRecord {
  id: string;
  userId: string;
  userRole: RoleFilter;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  status: "pending" | "under_review" | "verified" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  docs: DocumentEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  driver: "Driver",
  delivery_agent: "Delivery Agent",
};

const DOC_LABELS: Record<string, string> = {
  fssai: "FSSAI License",
  gst: "GST Certificate",
  panCard: "PAN Card",
  drivingLicense: "Driving License",
  vehicleRC: "Vehicle RC",
  vehicleInsurance: "Vehicle Insurance",
  aadhar: "Aadhaar Card",
  backgroundCheck: "Background Check",
  shopPhoto: "Shop Photo",
  profilePhoto: "Profile Photo",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const ROLE_COLORS: Record<string, string> = {
  seller: "bg-orange-100 text-orange-700",
  driver: "bg-blue-100 text-blue-700",
  delivery_agent: "bg-purple-100 text-purple-700",
};

function inferFileType(url: string): "image" | "pdf" | "unknown" {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  if (lower.includes(".pdf") || lower.includes("application/pdf")) return "pdf";
  if (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes("image/")
  )
    return "image";
  return "image"; // most uploads in this app are images
}

function extractDocEntries(
  documents: Record<string, unknown>
): DocumentEntry[] {
  const entries: DocumentEntry[] = [];

  Object.entries(documents).forEach(([key, val]) => {
    if (!val || typeof val !== "object") return;
    const d = val as Record<string, unknown>;

    // Single document object with url
    if (typeof d.url === "string" && d.url) {
      entries.push({
        docKey: key,
        url: d.url,
        fileType: inferFileType(d.url),
        uploadedAt: (d.uploadedAt as { toDate?: () => Date })?.toDate?.() ?? null,
        number: typeof d.number === "string" ? d.number : undefined,
        expiryDate: typeof d.expiryDate === "string" ? d.expiryDate : undefined,
      });
      return;
    }

    // Array of urls or objects
    if (Array.isArray(d)) {
      (d as unknown[]).forEach((item, idx) => {
        const url =
          typeof item === "string"
            ? item
            : typeof (item as Record<string, unknown>)?.url === "string"
            ? ((item as Record<string, unknown>).url as string)
            : null;
        if (url) {
          entries.push({
            docKey: `${key}_${idx}`,
            url,
            fileType: inferFileType(url),
            uploadedAt: null,
          });
        }
      });
    }
  });

  return entries;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  doc,
  onClose,
}: {
  doc: DocumentEntry;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="font-semibold text-gray-900">
              {DOC_LABELS[doc.docKey] ?? doc.docKey}
            </p>
            {doc.number && (
              <p className="text-sm text-gray-500">Number: {doc.number}</p>
            )}
            {doc.expiryDate && (
              <p className="text-sm text-gray-500">Expires: {doc.expiryDate}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Open full ↗
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center bg-gray-50 min-h-64">
          {doc.fileType === "pdf" ? (
            <iframe
              src={doc.url}
              className="w-full h-[70vh] rounded border"
              title="Document PDF"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.url}
              alt={DOC_LABELS[doc.docKey] ?? doc.docKey}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [lightboxDoc, setLightboxDoc] = useState<DocumentEntry | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const verRef = collection(db, "verificationRequests");

      let q;
      if (roleFilter !== "all") {
        q = query(verRef, where("userRole", "==", roleFilter));
      } else {
        q = query(verRef);
      }

      const snapshot = await getDocs(q);
      const data: VerificationRecord[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const docsRaw = d.documents ?? {};
        const docs = extractDocEntries(docsRaw);

        if (docs.length === 0) return; // skip records with no documents

        data.push({
          id: docSnap.id,
          userId: d.userId ?? "",
          userRole: d.userRole ?? "seller",
          name: d.name || d.email?.split("@")[0] || "Unknown",
          email: d.email ?? "",
          phone: d.phone ?? "",
          businessName: d.businessName,
          status: d.status ?? "pending",
          submittedAt: d.submittedAt?.toDate?.() ?? new Date(),
          reviewedAt: d.reviewedAt?.toDate?.(),
          reviewedBy: d.reviewedBy,
          docs,
        });
      });

      // Sort newest first
      data.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      setRecords(data);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // ─── Unique doc types across all records ────────────────────
  const allDocTypes = Array.from(
    new Set(records.flatMap((r) => r.docs.map((d) => d.docKey)))
  );

  // ─── Filtered records ────────────────────────────────────────
  const filtered = records.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    if (
      q &&
      !r.name.toLowerCase().includes(q) &&
      !r.email.toLowerCase().includes(q) &&
      !r.phone.includes(q) &&
      !(r.businessName ?? "").toLowerCase().includes(q)
    )
      return false;
    if (
      docTypeFilter !== "all" &&
      !r.docs.some((d) => d.docKey === docTypeFilter)
    )
      return false;
    return true;
  });

  const totalDocs = filtered.reduce((acc, r) => acc + r.docs.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Uploaded Documents
          </h1>
          <p className="text-gray-500 mt-1">
            {totalDocs} document{totalDocs !== 1 ? "s" : ""} across{" "}
            {filtered.length} verification request
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={loadDocuments}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <input
              type="text"
              placeholder="Search name / email / phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Role */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="all">All Roles</option>
            <option value="seller">Sellers</option>
            <option value="driver">Drivers</option>
            <option value="delivery_agent">Delivery Agents</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Doc Type */}
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="all">All Document Types</option>
            {allDocTypes.map((k) => (
              <option key={k} value={k}>
                {DOC_LABELS[k] ?? k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-gray-500">Loading documents...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-gray-600 font-semibold text-lg">No documents found</p>
          <p className="text-gray-400 text-sm mt-1">
            Try adjusting your filters or check back later.
          </p>
        </div>
      )}

      {/* Document Cards */}
      {!loading && (
        <div className="space-y-6">
          {filtered.map((record) => {
            const visibleDocs =
              docTypeFilter === "all"
                ? record.docs
                : record.docs.filter((d) => d.docKey === docTypeFilter);

            if (visibleDocs.length === 0) return null;

            const roleHref =
              record.userRole === "seller"
                ? "/dashboard/sellers"
                : record.userRole === "driver"
                ? "/dashboard/drivers"
                : "/dashboard/delivery-agents";

            return (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Record header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-lg">
                      {record.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{record.name}</p>
                      <p className="text-sm text-gray-500">{record.email}</p>
                      {record.businessName && (
                        <p className="text-xs text-gray-400">
                          {record.businessName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ROLE_COLORS[record.userRole] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ROLE_LABELS[record.userRole] ?? record.userRole}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        STATUS_STYLES[record.status]
                      }`}
                    >
                      {record.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {record.submittedAt.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <Link
                      href={roleHref}
                      className="ml-2 text-xs text-orange-500 hover:text-orange-700 font-semibold border border-orange-300 rounded px-2 py-1"
                    >
                      View Verification →
                    </Link>
                  </div>
                </div>

                {/* Doc grid */}
                <div className="p-6">
                  {record.reviewedBy && (
                    <p className="text-xs text-gray-400 mb-4">
                      Reviewed by {record.reviewedBy}
                      {record.reviewedAt
                        ? ` on ${record.reviewedAt.toLocaleDateString("en-IN")}`
                        : ""}
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {visibleDocs.map((d) => (
                      <button
                        key={d.docKey}
                        onClick={() => setLightboxDoc(d)}
                        className="group flex flex-col items-center border border-gray-200 rounded-lg p-3 hover:border-orange-400 hover:shadow-md transition-all text-left"
                      >
                        {/* Thumbnail */}
                        <div className="w-full h-28 bg-gray-100 rounded-md overflow-hidden mb-2 flex items-center justify-center">
                          {d.fileType === "pdf" ? (
                            <div className="text-center">
                              <div className="text-4xl">📄</div>
                              <p className="text-xs text-gray-400 mt-1">PDF</p>
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={d.url}
                              alt={DOC_LABELS[d.docKey] ?? d.docKey}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='55' font-size='30' text-anchor='middle' fill='%239ca3af'%3E📄%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-700 text-center leading-tight">
                          {DOC_LABELS[d.docKey] ?? d.docKey}
                        </p>
                        {d.number && (
                          <p className="text-xs text-gray-400 mt-0.5 text-center truncate w-full">
                            {d.number}
                          </p>
                        )}
                        {d.uploadedAt && (
                          <p className="text-xs text-gray-300 mt-0.5">
                            {d.uploadedAt.toLocaleDateString("en-IN")}
                          </p>
                        )}
                        <span className="mt-2 text-xs text-orange-500 group-hover:text-orange-700">
                          View ↗
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxDoc && (
        <Lightbox doc={lightboxDoc} onClose={() => setLightboxDoc(null)} />
      )}
    </div>
  );
}
