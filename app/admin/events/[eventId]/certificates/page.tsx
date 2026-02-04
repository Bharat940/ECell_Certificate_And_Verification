'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, FileText, Trash2, Upload, FileDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { CertificateTable } from '@/components/CertificateTable';
import { ImportCertificatesModal } from '@/components/ImportCertificatesModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDateRange } from '@/lib/dateUtils';

interface PageProps {
    params: Promise<{
        eventId: string;
    }>;
}

interface Event {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    organizer: string;
}

interface Certificate {
    id: string;
    certificateNumber: string;
    participantName: string;
    participantEmail?: string;
    certificateUrl: string;
    issuedAt: string;
    verificationUrl: string;
}

export default function EventCertificatesPage({ params }: PageProps) {
    const [eventId, setEventId] = useState('');
    const [event, setEvent] = useState<Event | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk delete state
    const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCertificates = certificates.filter(cert =>
        cert.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.participantEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const router = useRouter();

    useEffect(() => {
        params.then(({ eventId: id }) => {
            setEventId(id);
            fetchCertificates(id);
        });
    }, [params]);

    const fetchCertificates = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/events/${id}/certificates`, {
                credentials: 'include',
            });

            if (response.status === 401) {
                router.push('/admin');
                return;
            }

            if (response.status === 404) {
                setError('Event not found');
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setEvent(data.event);
                setCertificates(data.certificates);
            } else {
                setError(data.error || 'Failed to load certificates');
            }
        } catch (err) {
            setError('Failed to load certificates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCertificate = async () => {
        if (!deleteConfirmId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/certificates/${deleteConfirmId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Certificate deleted successfully!');
                await fetchCertificates(eventId);
                setDeleteConfirmId(null);
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete certificate');
            }
        } catch (err) {
            toast.error('Failed to delete certificate');
        } finally {
            setIsDeleting(false);
        }
    };

    // Bulk delete functions
    const toggleCertificateSelection = (id: string) => {
        const newSelection = new Set(selectedCertificates);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedCertificates(newSelection);
    };

    const toggleSelectAll = () => {
        const allFilteredIds = filteredCertificates.map(c => c.id);
        const allFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedCertificates.has(id));

        const newSelection = new Set(selectedCertificates);
        if (allFilteredSelected) {
            allFilteredIds.forEach(id => newSelection.delete(id));
        } else {
            allFilteredIds.forEach(id => newSelection.add(id));
        }
        setSelectedCertificates(newSelection);
    };

    const handleBulkDelete = async () => {
        if (selectedCertificates.size === 0) return;

        setIsBulkDeleting(true);
        const idsToDelete = Array.from(selectedCertificates);
        const BATCH_SIZE = 10;
        const totalBatches = Math.ceil(idsToDelete.length / BATCH_SIZE);
        let deletedCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        try {
            for (let i = 0; i < totalBatches; i++) {
                const batch = idsToDelete.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
                const toastId = toast.loading(`Deleting certificates... (Batch ${i + 1} of ${totalBatches})`);

                try {
                    const response = await fetch('/api/admin/certificates/bulk-delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ certificateIds: batch }),
                    });

                    toast.dismiss(toastId);

                    if (response.ok) {
                        const data = await response.json();
                        deletedCount += data.deleted || 0;
                        failedCount += data.failed || 0;
                        if (data.errors) {
                            errors.push(...data.errors.map((e: any) => e.error));
                        }
                    } else {
                        const data = await response.json();
                        failedCount += batch.length;
                        errors.push(data.error || 'Batch deletion failed');
                    }
                } catch (err) {
                    toast.dismiss(toastId);
                    failedCount += batch.length;
                    errors.push('Network error occurred');
                }
            }

            if (deletedCount > 0) {
                toast.success(`Successfully deleted ${deletedCount} certificate(s)!`);
            }
            if (failedCount > 0) {
                toast.error(`Failed to delete ${failedCount} certificate(s)`);
                console.error('Deletion errors:', errors);
            }

            await fetchCertificates(eventId);
            setSelectedCertificates(new Set());
            setShowBulkDeleteConfirm(false);
        } catch (err) {
            toast.error('An unexpected error occurred during deletion');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (filteredCertificates.length === 0) return;

        setIsBulkDeleting(true);
        const allIds = filteredCertificates.map(c => c.id);
        const BATCH_SIZE = 10;
        const totalBatches = Math.ceil(allIds.length / BATCH_SIZE);
        let deletedCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        try {
            for (let i = 0; i < totalBatches; i++) {
                const batch = allIds.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
                // We use a temporary toast for progress, but ConfirmDialog might prevent interaction.
                // Since ConfirmDialog is open, toasts will show on top.
                const toastId = toast.loading(`Deleting ALL certificates... (Batch ${i + 1} of ${totalBatches})`);

                try {
                    const response = await fetch('/api/admin/certificates/bulk-delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ certificateIds: batch }),
                    });

                    toast.dismiss(toastId);

                    if (response.ok) {
                        const data = await response.json();
                        deletedCount += data.deleted || 0;
                        failedCount += data.failed || 0;
                        if (data.errors) {
                            errors.push(...data.errors.map((e: any) => e.error));
                        }
                    } else {
                        const data = await response.json();
                        failedCount += batch.length;
                        errors.push(data.error || 'Batch deletion failed');
                    }
                } catch (err) {
                    toast.dismiss(toastId);
                    failedCount += batch.length;
                    errors.push('Network error occurred');
                }
            }

            if (deletedCount > 0) {
                toast.success(`Successfully deleted ${deletedCount} certificates!`);
            }
            if (failedCount > 0) {
                toast.error(`Failed to delete ${failedCount} certificate(s)`);
                console.error('Deletion errors:', errors);
            }

            await fetchCertificates(eventId);

            // Clear deleted IDs from selection
            const newSelection = new Set(selectedCertificates);
            allIds.forEach(id => newSelection.delete(id));
            setSelectedCertificates(newSelection);

            setShowDeleteAllConfirm(false);
            setDeleteAllConfirmText('');
        } catch (err) {
            toast.error('An unexpected error occurred during deletion');
            setIsBulkDeleting(false); // Only reset if critical outer error
        } finally {
            setIsBulkDeleting(false);
            // Ensure dialog is closed even if failed, as per user request to avoid issues
            setShowDeleteAllConfirm(false);
        }
    };

    const handleExportSelected = async (format: 'csv' | 'xlsx') => {
        const ids = selectedCertificates.size > 0
            ? Array.from(selectedCertificates)
            : filteredCertificates.map(c => c.id);
        if (ids.length === 0) {
            toast.error('No certificates to export');
            return;
        }
        setIsExporting(true);
        try {
            const res = await fetch('/api/admin/certificates/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ certificateIds: ids, format }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || 'Export failed');
                return;
            }
            const blob = await res.blob();
            const ext = format === 'csv' ? 'csv' : 'xlsx';
            const filename = `certificates-export-${Date.now()}.${ext}`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported ${ids.length} certificate(s) as ${ext.toUpperCase()}`);
        } catch (err) {
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin/dashboard"
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Event Certificates</h1>
                                {event && (
                                    <p className="text-slate-400 text-sm mt-1">
                                        {formatDateRange(new Date(event.startDate), new Date(event.endDate))}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-6 text-center">
                            <p className="text-red-200">{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Event Info Card */}
                            {event && (
                                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                                            <div>
                                                <p className="text-slate-400 text-sm">Event Date</p>
                                                <p className="text-white font-semibold">
                                                    {formatDateRange(new Date(event.startDate), new Date(event.endDate))}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <User className="w-5 h-5 text-cyan-400 mt-0.5" />
                                            <div>
                                                <p className="text-slate-400 text-sm">Organizer</p>
                                                <p className="text-white font-semibold">{event.organizer}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-5 h-5 text-green-400 mt-0.5" />
                                            <div>
                                                <p className="text-slate-400 text-sm">Total Certificates</p>
                                                <p className="text-white font-semibold">{certificates.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Certificates Table */}
                            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
                                <div className="flex flex-col gap-6 mb-6">
                                    <h2 className="text-xl font-bold text-white">Issued Certificates</h2>

                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                        {/* Search Bar */}
                                        <div className="relative w-full lg:w-96">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, or certificate number..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 justify-end w-full lg:w-auto">
                                            <button
                                                type="button"
                                                onClick={() => setShowImportModal(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Import
                                            </button>
                                            <button
                                                type="button"
                                                disabled={certificates.length === 0 || isExporting}
                                                onClick={() => handleExportSelected('csv')}
                                                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
                                                title="Export all as CSV"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                Export All CSV
                                            </button>
                                            <button
                                                type="button"
                                                disabled={certificates.length === 0 || isExporting}
                                                onClick={() => handleExportSelected('xlsx')}
                                                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
                                                title="Export all as XLSX"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                Export All XLSX
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteAllConfirm(true)}
                                                disabled={filteredCertificates.length === 0}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-700/50 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete All ({filteredCertificates.length})
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <CertificateTable
                                    certificates={filteredCertificates}
                                    selectedIds={selectedCertificates}
                                    onToggleSelect={toggleCertificateSelection}
                                    onSelectAll={toggleSelectAll}
                                    onDelete={(id) => setDeleteConfirmId(id)}
                                    onBulkDelete={() => setShowBulkDeleteConfirm(true)}
                                    onExportSelected={handleExportSelected}
                                    isLoading={isExporting}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={handleDeleteCertificate}
                title="Delete Certificate?"
                message="Are you sure you want to delete this certificate? This action cannot be undone. The certificate PDF will be permanently removed from cloud storage."
                confirmText="Delete"
                confirmVariant="danger"
                isLoading={isDeleting}
            />

            {/* Bulk Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Selected Certificates?"
                message={`You are about to delete ${selectedCertificates.size} certificate(s).

This will:
• Permanently delete ${selectedCertificates.size} certificate PDF(s) from Cloudinary
• Remove all database records
• Break ${selectedCertificates.size} verification URL(s)

This action CANNOT be undone!`}
                confirmText={`Delete ${selectedCertificates.size} Certificate(s)`}
                confirmVariant="danger"
                isLoading={isBulkDeleting}
            />

            {/* Delete All Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteAllConfirm}
                onClose={() => {
                    setShowDeleteAllConfirm(false);
                    setDeleteAllConfirmText('');
                }}
                onConfirm={handleDeleteAll}
                title="🚨 Delete ALL Certificates?"
                message={`You are about to delete ${filteredCertificates.length} certificate(s)${searchTerm ? ' matching your search' : ''}!

This will:
• Permanently delete ${filteredCertificates.length} certificate PDFs from Cloudinary
• Remove all database records
• Break ALL verification URLs for this event

⚠️ This action CANNOT be undone!

Type "DELETE ALL" to confirm:`}
                confirmText="Delete All Certificates"
                confirmVariant="danger"
                isLoading={isBulkDeleting}
                requireConfirmText="DELETE ALL"
                confirmTextValue={deleteAllConfirmText}
                onConfirmTextChange={setDeleteAllConfirmText}
            />

            <ImportCertificatesModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                eventId={eventId}
                eventTitle={event?.title}
                onSuccess={() => fetchCertificates(eventId)}
            />
        </div>
    );
}
