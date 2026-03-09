// components/verification/DocumentViewer.tsx
"use client";

import React, { useState } from "react";

interface Document {
  name: string;
  url: string;
  uploadedAt?: Date;
  type?: "image" | "pdf";
}

interface DocumentViewerProps {
  documents: Record<string, string> | Document[];
  title?: string;
}

export default function DocumentViewer({
  documents,
  title = "Documents",
}: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [zoom, setZoom] = useState(1);

  // Convert object to array if needed
  const documentArray = Array.isArray(documents)
    ? documents
    : Object.entries(documents).map(([name, url]) => ({ name, url }));

  return (
    <>
      {/* Document Gallery */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {documentArray.map((doc, index) => {
            const docName =
              typeof doc === "string" ? index.toString() : doc.name;
            const docUrl = typeof doc === "string" ? doc : doc.url;

            return (
              <button
                key={`${docName}-${index}`}
                onClick={() =>
                  setSelectedDocument({
                    name: docName,
                    url: docUrl,
                  })
                }
                className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-500 transition-all"
              >
                <img
                  src={docUrl}
                  alt={docName}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <span className="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    🔍
                  </span>
                </div>
                <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
                  {docName.toUpperCase()}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Screen Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-4 text-white">
            <h2 className="text-xl font-bold">
              {selectedDocument.name.toUpperCase()}
            </h2>
            <button
              onClick={() => setSelectedDocument(null)}
              className="text-2xl hover:text-orange-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center w-full max-w-4xl">
            <img
              src={selectedDocument.url}
              alt={selectedDocument.name}
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.2s",
              }}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Controls */}
          <div className="w-full flex items-center justify-center gap-4 mt-4 text-white">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition-colors"
            >
              🔍− Zoom Out
            </button>
            <span className="text-sm font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.2))}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition-colors"
            >
              🔍+ Zoom In
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              Reset
            </button>
            <a
              href={selectedDocument.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
            >
              Open Full
            </a>
          </div>

          {/* Navigation */}
          <div className="mt-4 flex gap-2 text-white">
            <button
              onClick={() => {
                const currentIndex = documentArray.findIndex(
                  (d) =>
                    (typeof d === "string" ? d : d.url) === selectedDocument.url
                );
                if (currentIndex > 0) {
                  const prevDoc = documentArray[currentIndex - 1];
                  setSelectedDocument({
                    name: typeof prevDoc === "string" ? "Doc" : prevDoc.name,
                    url: typeof prevDoc === "string" ? prevDoc : prevDoc.url,
                  });
                  setZoom(1);
                }
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              Document{" "}
              {documentArray.findIndex(
                (d) =>
                  (typeof d === "string" ? d : d.url) === selectedDocument.url
              ) + 1}{" "}
              of {documentArray.length}
            </span>
            <button
              onClick={() => {
                const currentIndex = documentArray.findIndex(
                  (d) =>
                    (typeof d === "string" ? d : d.url) === selectedDocument.url
                );
                if (currentIndex < documentArray.length - 1) {
                  const nextDoc = documentArray[currentIndex + 1];
                  setSelectedDocument({
                    name: typeof nextDoc === "string" ? "Doc" : nextDoc.name,
                    url: typeof nextDoc === "string" ? nextDoc : nextDoc.url,
                  });
                  setZoom(1);
                }
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Close on ESC */}
          <div className="mt-4 text-gray-400 text-sm">
            Press ESC or click X to close
          </div>
        </div>
      )}
    </>
  );
}

// Hook for keyboard navigation
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // Will be handled by modal component
    }
  });
}
