'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CertificateCard } from '@/components/CertificateCard';
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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
        if (selectedCertificates.size === certificates.length) {
            setSelectedCertificates(new Set());
        } else {
            setSelectedCertificates(new Set(certificates.map(c => c.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCertificates.size === 0) return;

        setIsBulkDeleting(true);
        try {
            const response = await fetch('/api/admin/certificates/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    certificateIds: Array.from(selectedCertificates)
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.deleted > 0) {
                    toast.success(`Successfully deleted ${data.deleted} certificate(s)!`);
                }
                if (data.failed > 0) {
                    toast.error(`Failed to delete ${data.failed} certificate(s)`);
                }
                await fetchCertificates(eventId);
                setSelectedCertificates(new Set());
                setShowBulkDeleteConfirm(false);
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete certificates');
            }
        } catch (err) {
            toast.error('Failed to delete certificates');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (certificates.length === 0) return;

        setIsBulkDeleting(true);
        try {
            const allIds = certificates.map(c => c.id);
            const response = await fetch('/api/admin/certificates/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    certificateIds: allIds
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.deleted > 0) {
                    toast.success(`Successfully deleted all ${data.deleted} certificates!`);
                }
                if (data.failed > 0) {
                    toast.error(`Failed to delete ${data.failed} certificate(s)`);
                }
                await fetchCertificates(eventId);
                setSelectedCertificates(new Set());
                setShowDeleteAllConfirm(false);
                setDeleteAllConfirmText('');
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete certificates');
            }
        } catch (err) {
            toast.error('Failed to delete certificates');
        } finally {
            setIsBulkDeleting(false);
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

                            {/* Certificates List */}
                            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
                                <h2 className="text-xl font-bold text-white mb-4">Issued Certificates</h2>

                                {certificates.length === 0 ? (
                                    <p className="text-slate-400 text-center py-8">
                                        No certificates have been issued for this event yet.
                                    </p>
                                ) : (
                                    <>
                                        {/* Bulk Actions Toolbar */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                                            {/* Left: Selection Controls */}
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCertificates.size === certificates.length && certificates.length > 0}
                                                        onChange={toggleSelectAll}
                                                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                                                    />
                                                    <span className="text-sm">
                                                        {selectedCertificates.size === certificates.length && certificates.length > 0
                                                            ? 'Deselect All'
                                                            : 'Select All'}
                                                    </span>
                                                </label>
                                                <span className="text-slate-400 text-sm">
                                                    {selectedCertificates.size} of {certificates.length} selected
                                                </span>
                                            </div>

                                            {/* Right: Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={selectedCertificates.size === 0}
                                                    onClick={() => setShowBulkDeleteConfirm(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete Selected ({selectedCertificates.size})
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteAllConfirm(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-700/50 hover:bg-red-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete All ({certificates.length})
                                                </button>
                                            </div>
                                        </div>

                                        {/* Certificate Cards */}
                                        <div className="space-y-3">
                                            {certificates.map((cert) => (
                                                <CertificateCard
                                                    key={cert.id}
                                                    certificate={cert}
                                                    isSelected={selectedCertificates.has(cert.id)}
                                                    onToggleSelect={() => toggleCertificateSelection(cert.id)}
                                                    onDelete={(id) => setDeleteConfirmId(id)}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
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
                message={`You are about to delete ALL ${certificates.length} certificates for this event!

This will:
• Permanently delete ${certificates.length} certificate PDFs from Cloudinary
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
        </div>
    );
}
