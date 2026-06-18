"use client";

import { useState, useRef } from "react";
import {
  X,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Upload,
  Loader2,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface GeneratedCertificate {
  certificateNumber: string;
  participantName: string;
  certificateUrl: string;
  verificationUrl: string;
}

interface UploadedCertificateResponse {
  certificateNumber: string;
  participantName: string;
  certificateUrl: string;
}

interface CertificateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    eventId: string;
    participantName: string;
    participantEmail?: string;
  }) => Promise<void>;
  onUploadSuccess: (certificate: UploadedCertificateResponse) => void;
  isLoading: boolean;
  error: string;
  events: Event[];
  formData: {
    selectedEventId: string;
    participantName: string;
    participantEmail: string;
  };
  onFormChange: {
    setSelectedEventId: (value: string) => void;
    setParticipantName: (value: string) => void;
    setParticipantEmail: (value: string) => void;
  };
  generatedCert: GeneratedCertificate | null;
  onCopyToClipboard: (text: string) => void;
}

export function CertificateFormModal({
  isOpen,
  onClose,
  onSubmit,
  onUploadSuccess,
  isLoading,
  error,
  events,
  formData,
  onFormChange,
  generatedCert,
  onCopyToClipboard,
}: CertificateFormModalProps) {
  const [mode, setMode] = useState<"generate" | "upload">("generate");
  const [customCertificateNumber, setCustomCertificateNumber] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError("");

    if (mode === "upload") {
      if (!pdfFile) {
        setUploadError("Please select a PDF file.");
        return;
      }
      if (!customCertificateNumber) {
        setUploadError("Please provide a certificate number.");
        return;
      }

      setIsUploading(true);
      try {
        const uploadData = new FormData();
        uploadData.append("file", pdfFile);
        uploadData.append(
          "certificateNumber",
          customCertificateNumber.trim().toUpperCase(),
        );
        uploadData.append("eventId", formData.selectedEventId);
        uploadData.append("participantName", formData.participantName.trim());
        if (formData.participantEmail.trim()) {
          uploadData.append(
            "participantEmail",
            formData.participantEmail.trim(),
          );
        }

        const res = await fetch("/api/admin/certificates/upload", {
          method: "POST",
          body: uploadData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to upload PDF file");
        }

        if (!data.success || !data.certificate) {
          throw new Error("Invalid response from certificate upload");
        }
        onUploadSuccess(data.certificate as UploadedCertificateResponse);

        // Clear states on success
        setPdfFile(null);
        setCustomCertificateNumber("");
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    } else {
      await onSubmit({
        eventId: formData.selectedEventId,
        participantName: formData.participantName,
        participantEmail: formData.participantEmail || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full border border-slate-800 my-auto shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/50 pb-3 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {mode === "upload" ? "Upload Certificate" : "Generate Certificate"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!generatedCert ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Scrollable Form Fields */}
            <div className="flex-1 overflow-y-auto pr-1.5 py-1 space-y-4 min-h-0">
              {/* Mode Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode("generate")}
                  className={`flex-1 py-1.5 sm:py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === "generate"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  className={`flex-1 py-1.5 sm:py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === "upload"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Upload Custom PDF
                </button>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Select Event
                </label>
                <select
                  value={formData.selectedEventId}
                  onChange={(e) =>
                    onFormChange.setSelectedEventId(e.target.value)
                  }
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} -{" "}
                      {new Date(event.startDate).toLocaleDateString()}
                      {event.startDate !== event.endDate &&
                        ` to ${new Date(event.endDate).toLocaleDateString()}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Participant Name
                </label>
                <input
                  type="text"
                  value={formData.participantName}
                  onChange={(e) =>
                    onFormChange.setParticipantName(e.target.value)
                  }
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g., Ishaan Mathur | Team Supervisor (Lead)"
                />
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 leading-relaxed">
                  For committee/tenure certs, use{" "}
                  <span className="text-cyan-400 font-mono">
                    Name | Position
                  </span>{" "}
                  (e.g.{" "}
                  <span className="text-slate-400 font-mono">
                    Ishaan Mathur | Team Supervisor (Lead)
                  </span>
                  ). For regular events, just enter the name.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Participant Email{" "}
                  <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.participantEmail}
                  onChange={(e) =>
                    onFormChange.setParticipantEmail(e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g., john@example.com"
                />
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  Email will be stored for record keeping
                </p>
              </div>

              {mode === "upload" && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                      Certificate Number
                    </label>
                    <input
                      type="text"
                      value={customCertificateNumber}
                      onChange={(e) =>
                        setCustomCertificateNumber(e.target.value)
                      }
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500 font-mono tracking-wider"
                      placeholder="e.g., ECELL-2026-PASS01"
                    />
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                      Must match standard pattern (e.g. ECELL-YYYY-XXXXX)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                      Certificate PDF
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 sm:p-5 text-center cursor-pointer transition-all ${
                        pdfFile
                          ? "border-cyan-500 bg-cyan-500/5"
                          : "border-slate-700 bg-slate-950/20 hover:border-slate-600 hover:bg-slate-900/40"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) =>
                          setPdfFile(e.target.files?.[0] || null)
                        }
                        accept=".pdf"
                        className="hidden"
                      />
                      <Upload
                        className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 ${pdfFile ? "text-cyan-400" : "text-slate-500"}`}
                      />
                      {pdfFile ? (
                        <div className="space-y-1">
                          <p className="text-white text-xs sm:text-sm font-medium truncate px-2">
                            {pdfFile.name}
                          </p>
                          <p className="text-slate-400 text-[10px] sm:text-xs">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-slate-300 text-xs sm:text-sm font-medium">
                            Click to select PDF certificate
                          </p>
                          <p className="text-slate-500 text-[10px] sm:text-xs">
                            PDF format only (Max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {(error || uploadError) && (
                <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-3 text-red-200 text-xs sm:text-sm">
                  {error || uploadError}
                </div>
              )}
            </div>

            {/* Fixed Actions Footer */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-slate-800/50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading || isUploading}
                className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 sm:py-2.5 text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="w-full sm:flex-1 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 sm:py-2.5 text-sm rounded-lg transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {(isLoading || isUploading) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isUploading
                  ? "Uploading PDF..."
                  : isLoading
                    ? "Registering..."
                    : mode === "upload"
                      ? "Upload & Register"
                      : "Generate"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Success Details */}
            <div className="flex-1 overflow-y-auto pr-1.5 py-1 space-y-4 min-h-0">
              <div className="flex justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-base sm:text-lg font-bold text-white mb-1.5">
                  Certificate Generated!
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm truncate px-1">
                  For {generatedCert.participantName}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 space-y-3">
                <div>
                  <p className="text-slate-400 text-[10px] sm:text-xs mb-1">
                    Certificate Number
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-cyan-400 font-mono text-xs sm:text-sm truncate">
                      {generatedCert.certificateNumber}
                    </code>
                    <button
                      onClick={() =>
                        onCopyToClipboard(generatedCert.certificateNumber)
                      }
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-slate-800"
                      title="Copy certificate number"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] sm:text-xs mb-1">
                    Verification URL
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-blue-400 text-xs truncate">
                      {generatedCert.verificationUrl}
                    </code>
                    <button
                      onClick={() =>
                        onCopyToClipboard(generatedCert.verificationUrl)
                      }
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-slate-800"
                      title="Copy verification URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Success Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-slate-800/50 shrink-0">
              <a
                href={generatedCert.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 sm:py-2.5 text-sm rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
              <a
                href={generatedCert.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 sm:py-2.5 text-sm rounded-lg transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                View Certificate
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 text-sm rounded-lg transition-colors cursor-pointer mt-3 shrink-0"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
