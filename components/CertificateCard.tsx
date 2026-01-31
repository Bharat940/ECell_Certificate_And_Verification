'use client';

import { Download, ExternalLink, Copy, Calendar, User, Hash, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CertificateCardProps {
    certificate: {
        id: string;
        certificateNumber: string;
        participantName: string;
        participantEmail?: string;
        certificateUrl: string;
        issuedAt: string;
        verificationUrl: string;
    };
    isSelected?: boolean;
    onToggleSelect?: () => void;
    onDelete?: (id: string) => void;
    showActions?: boolean;
}

export function CertificateCard({ certificate, isSelected = false, onToggleSelect, onDelete, showActions = true }: CertificateCardProps) {
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    return (
        <div className={`bg-slate-800/30 rounded-lg p-4 border transition-colors ${isSelected
                ? 'border-blue-500 bg-blue-950/20'
                : 'border-slate-700/50 hover:border-slate-600/50'
            }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Checkbox */}
                {onToggleSelect && (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelect}
                            className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                    </div>
                )}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-white font-semibold text-lg">
                            {certificate.participantName}
                        </h3>
                    </div>

                    {certificate.participantEmail && (
                        <p className="text-slate-400 text-sm">
                            {certificate.participantEmail}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-cyan-400" />
                            <code className="text-cyan-400 font-mono">
                                {certificate.certificateNumber}
                            </code>
                            <button
                                onClick={() => copyToClipboard(certificate.certificateNumber, 'Certificate number')}
                                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Copy certificate number"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                                Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {showActions && (
                    <div className="flex items-center gap-2">
                        <a
                            href={certificate.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                        </a>
                        <a
                            href={certificate.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/50 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm cursor-pointer"
                            title="View certificate"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                        </a>
                        {onDelete && (
                            <button
                                onClick={() => onDelete(certificate.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg transition-colors text-sm cursor-pointer"
                                title="Delete certificate"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
