'use client';

import { Download, ExternalLink, Copy, Calendar, User, Hash, Trash2, FileDown, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface Certificate {
    id: string;
    certificateNumber: string;
    participantName: string;
    participantEmail?: string;
    certificateUrl: string;
    issuedAt: string;
    verificationUrl: string;
    emailStatus?: 'sent' | 'failed' | 'pending' | null;
    emailSentAt?: string | null;
    emailError?: string | null;
}

interface CertificateTableProps {
    certificates: Certificate[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
    onDelete: (id: string) => void;
    onBulkDelete: () => void;
    onExportSelected: (format: 'csv' | 'xlsx') => void;
    onSendEmail: (certificate: Certificate) => void;
    isLoading?: boolean;
}

export function CertificateTable({
    certificates,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onDelete,
    onBulkDelete,
    onExportSelected,
    onSendEmail,
    isLoading = false,
}: CertificateTableProps) {
    const allSelected = certificates.length > 0 && certificates.every(c => selectedIds.has(c.id));

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    if (certificates.length === 0) {
        return (
            <p className="text-slate-400 text-center py-8">
                No certificates have been issued for this event yet.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={onSelectAll}
                            className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                        <span className="text-sm">
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </span>
                    </label>
                    <span className="text-slate-400 text-sm">
                        {selectedIds.size} of {certificates.length} selected
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 text-sm mr-1">Export:</span>
                    <button
                        type="button"
                        disabled={selectedIds.size === 0}
                        onClick={() => onExportSelected('csv')}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Export selected as CSV"
                    >
                        <Download className="w-4 h-4" />
                        CSV
                    </button>
                    <button
                        type="button"
                        disabled={selectedIds.size === 0}
                        onClick={() => onExportSelected('xlsx')}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Export selected as XLSX"
                    >
                        <Download className="w-4 h-4" />
                        XLSX
                    </button>
                    <button
                        disabled={selectedIds.size === 0}
                        onClick={onBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected ({selectedIds.size})
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-700/50 rounded-lg">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-800/80 text-slate-300 text-left">
                            <th className="p-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={onSelectAll}
                                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    aria-label="Select all"
                                />
                            </th>
                            <th className="p-3">Participant</th>
                            <th className="p-3">Certificate #</th>
                            <th className="p-3">Email Status</th>
                            <th className="p-3">Issued</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.map((cert) => (
                            <tr
                                key={cert.id}
                                className={`border-t border-slate-700/50 transition-colors ${selectedIds.has(cert.id)
                                        ? 'bg-blue-950/20 border-l-2 border-l-blue-500'
                                        : 'hover:bg-slate-800/30'
                                    }`}
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(cert.id)}
                                        onChange={() => onToggleSelect(cert.id)}
                                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        aria-label={`Select ${cert.participantName}`}
                                    />
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <div>
                                            <span className="font-medium text-white">{cert.participantName}</span>
                                            {cert.participantEmail && (
                                                <p className="text-slate-400 text-xs">{cert.participantEmail}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                                        <code className="text-cyan-400 font-mono">{cert.certificateNumber}</code>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(cert.certificateNumber, 'Certificate number')}
                                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                                            title="Copy certificate number"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        {cert.emailStatus === 'sent' ? (
                                            <span className="flex items-center whitespace-nowrap gap-1.5 px-2 py-1 bg-emerald-950/50 text-emerald-400 rounded text-xs border border-emerald-900/50" title={cert.emailSentAt ? new Date(cert.emailSentAt).toLocaleString() : ''}>
                                                <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-400"></div> Sent
                                            </span>
                                        ) : cert.emailStatus === 'failed' ? (
                                            <span className="flex items-center whitespace-nowrap gap-1.5 px-2 py-1 bg-red-950/50 text-red-400 rounded text-xs border border-red-900/50" title={cert.emailError || 'Failed to send'}>
                                                <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-red-400"></div> Failed
                                            </span>
                                        ) : !cert.participantEmail ? (
                                            <span className="flex items-center whitespace-nowrap gap-1.5 px-2 py-1 bg-slate-900 text-slate-500 rounded text-xs border border-slate-800" title="No email address">
                                                <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-slate-600"></div> No Email
                                            </span>
                                        ) : (
                                            <span className="flex items-center whitespace-nowrap gap-1.5 px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs border border-slate-700">
                                                <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-slate-400"></div> Not Sent
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4 shrink-0" />
                                        {new Date(cert.issuedAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-nowrap min-w-max">
                                        <button
                                            type="button"
                                            onClick={() => onSendEmail(cert)}
                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-900/40 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-800/50 rounded transition-colors text-xs cursor-pointer"
                                            title="Send Email"
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="hidden xl:inline">Email</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(cert.verificationUrl, 'Verification link')}
                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded transition-colors text-xs cursor-pointer"
                                            title="Copy verification URL"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span className="hidden xl:inline">Copy link</span>
                                        </button>
                                        <a
                                            href={cert.certificateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded transition-colors text-xs cursor-pointer"
                                            title="Download PDF"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span className="hidden xl:inline">PDF</span>
                                        </a>
                                        <a
                                            href={cert.verificationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-600/50 hover:bg-blue-600 text-white rounded transition-colors text-xs cursor-pointer"
                                            title="View certificate"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span className="hidden xl:inline">View</span>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(cert.id)}
                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-red-600/50 hover:bg-red-600 text-white rounded transition-colors text-xs cursor-pointer"
                                            title="Delete certificate"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="hidden xl:inline">Delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isLoading && (
                <div className="flex justify-center py-4">
                    <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
