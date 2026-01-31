'use client';

import { X, CheckCircle2, Copy, Download, ExternalLink } from 'lucide-react';

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

interface CertificateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
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
    isLoading,
    error,
    events,
    formData,
    onFormChange,
    generatedCert,
    onCopyToClipboard,
}: CertificateFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 my-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Generate Certificate</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!generatedCert ? (
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Select Event</label>
                            <select
                                value={formData.selectedEventId}
                                onChange={(e) => onFormChange.setSelectedEventId(e.target.value)}
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">Choose an event...</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.title} - {new Date(event.startDate).toLocaleDateString()}
                                        {event.startDate !== event.endDate && ` to ${new Date(event.endDate).toLocaleDateString()}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Participant Name</label>
                            <input
                                type="text"
                                value={formData.participantName}
                                onChange={(e) => onFormChange.setParticipantName(e.target.value)}
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                placeholder="e.g., John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Participant Email <span className="text-slate-500">(Optional)</span>
                            </label>
                            <input
                                type="email"
                                value={formData.participantEmail}
                                onChange={(e) => onFormChange.setParticipantEmail(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                placeholder="e.g., john@example.com"
                            />
                            <p className="text-xs text-slate-400 mt-1">Email will be stored for record keeping</p>
                        </div>

                        {error && (
                            <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-3 text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <div className="text-center">
                            <h4 className="text-lg font-bold text-white mb-2">Certificate Generated!</h4>
                            <p className="text-slate-400 text-sm">For {generatedCert.participantName}</p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Certificate Number</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-cyan-400 font-mono text-sm">{generatedCert.certificateNumber}</code>
                                    <button
                                        onClick={() => onCopyToClipboard(generatedCert.certificateNumber)}
                                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                                        title="Copy certificate number"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-slate-400 text-xs mb-1">Verification URL</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-blue-400 text-xs truncate">{generatedCert.verificationUrl}</code>
                                    <button
                                        onClick={() => onCopyToClipboard(generatedCert.verificationUrl)}
                                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                                        title="Copy verification URL"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <a
                                href={generatedCert.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </a>
                            <a
                                href={generatedCert.verificationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 rounded-lg transition-all cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Certificate
                            </a>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
