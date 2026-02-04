'use client';

import { useState, useCallback } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ImportRowData } from '@/lib/importValidation';

interface PreviewRow {
    index: number;
    data: ImportRowData;
    isValid: boolean;
    errors: string[];
}

interface ImportCertificatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle?: string;
    onSuccess: () => void;
}

const MAX_GENERATE_PER_REQUEST = 5;

export function ImportCertificatesModal({
    isOpen,
    onClose,
    eventId,
    eventTitle,
    onSuccess,
}: ImportCertificatesModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'generating'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });

    const reset = useCallback(() => {
        setStep('upload');
        setFile(null);
        setPreviewRows([]);
        setSelectedIndices(new Set());
        setUploadError('');
        setProgress({ current: 0, total: 0, successes: 0, failures: 0 });
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [onClose, reset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        setFile(f || null);
        setUploadError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadError('Please select an Excel (.xlsx, .xls) or CSV file.');
            return;
        }
        setIsUploading(true);
        setUploadError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/certificates/import', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                setUploadError(data.error || data.details || 'Import failed');
                return;
            }
            if (!data.success || !Array.isArray(data.rows)) {
                setUploadError('Invalid response from server');
                return;
            }
            setPreviewRows(data.rows);
            const validIndices = data.rows
                .filter((r: PreviewRow) => r.isValid)
                .map((r: PreviewRow) => r.index);
            setSelectedIndices(new Set(validIndices));
            setStep('preview');
            toast.success(`Parsed ${data.total} rows (${data.valid} valid, ${data.invalid} invalid)`);
        } catch (err) {
            setUploadError('Failed to upload or parse file');
            toast.error('Import failed');
        } finally {
            setIsUploading(false);
        }
    };

    const toggleRow = (index: number) => {
        const row = previewRows.find((r) => r.index === index);
        if (!row || !row.isValid) return;
        const next = new Set(selectedIndices);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setSelectedIndices(next);
    };

    const selectAllValid = () => {
        const validIndices = previewRows.filter((r) => r.isValid).map((r) => r.index);
        if (selectedIndices.size === validIndices.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(validIndices));
        }
    };

    const handleGenerate = async () => {
        const toGenerate = previewRows
            .filter((r) => r.isValid && selectedIndices.has(r.index))
            .map((r) => ({ data: r.data, isValid: true }));

        if (toGenerate.length === 0) {
            toast.error('Select at least one valid row to generate.');
            return;
        }

        setIsGenerating(true);
        setStep('generating');

        const totalBatches = Math.ceil(toGenerate.length / MAX_GENERATE_PER_REQUEST);
        let successes = 0;
        let failures = 0;
        const allErrors: string[] = [];

        for (let i = 0; i < totalBatches; i++) {
            const batchNum = i + 1;
            setProgress({
                current: batchNum,
                total: totalBatches,
                successes,
                failures
            });

            const start = i * MAX_GENERATE_PER_REQUEST;
            const end = start + MAX_GENERATE_PER_REQUEST;
            const batch = toGenerate.slice(start, end);

            try {
                const res = await fetch('/api/admin/certificates/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ eventId, rows: batch }),
                });

                const data = await res.json();

                if (!res.ok) {
                    failures += batch.length;
                    allErrors.push(`Batch ${batchNum}: ${data.error || 'Request failed'}`);
                } else {
                    successes += data.generated || 0;
                    failures += data.failed || 0;
                    if (data.errors) {
                        allErrors.push(...data.errors);
                    }
                }
            } catch (err) {
                failures += batch.length;
                allErrors.push(`Batch ${batchNum}: Network error`);
            }
        }

        setIsGenerating(false);

        if (successes > 0) {
            toast.success(`Successfully generated ${successes} certificate(s)!`);
            onSuccess();
            handleClose();
        }

        if (failures > 0) {
            toast.error(`Failed to generate ${failures} certificate(s).`);
            setStep('preview');
            if (allErrors.length > 0) {
                console.error(allErrors);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white">
                        {step === 'upload' && 'Import Certificates'}
                        {step === 'preview' && 'Preview & Generate'}
                        {step === 'generating' && 'Generating...'}
                    </h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isGenerating}
                        className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-auto flex-1">
                    {step === 'upload' && (
                        <>
                            <p className="text-slate-400 text-sm mb-4">
                                Upload an Excel (.xlsx, .xls) or CSV file with columns: participantName, eventName,
                                eventStartDate, eventEndDate, participantEmail (optional), certificateNumber (optional).
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white cursor-pointer transition-colors">
                                    <FileSpreadsheet className="w-5 h-5" />
                                    <span>Choose file</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                {file && (
                                    <span className="text-slate-300 text-sm truncate max-w-xs">{file.name}</span>
                                )}
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Upload className="w-5 h-5" />
                                    )}
                                    {isUploading ? 'Parsing...' : 'Upload & Preview'}
                                </button>
                            </div>
                            {uploadError && (
                                <p className="mt-3 text-red-400 text-sm">{uploadError}</p>
                            )}
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            {eventTitle && (
                                <p className="text-slate-400 text-sm mb-3">
                                    Event: <span className="text-white font-medium">{eventTitle}</span>
                                </p>
                            )}
                            <p className="text-slate-400 text-sm mb-3">
                                Select valid rows to generate certificates. Invalid rows are not generated.
                            </p>
                            <div className="mb-4 flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                                    <input
                                        type="checkbox"
                                        checked={
                                            previewRows.filter((r) => r.isValid).length > 0 &&
                                            selectedIndices.size === previewRows.filter((r) => r.isValid).length
                                        }
                                        onChange={selectAllValid}
                                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm">Select all valid</span>
                                </label>
                                <span className="text-slate-400 text-sm">
                                    {selectedIndices.size} of {previewRows.filter((r) => r.isValid).length} valid selected
                                </span>
                            </div>
                            <div className="overflow-x-auto border border-slate-700 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-800/80 text-slate-300 text-left">
                                            <th className="p-2 w-10">#</th>
                                            <th className="p-2">Select</th>
                                            <th className="p-2">Name</th>
                                            <th className="p-2">Email</th>
                                            <th className="p-2">Event</th>
                                            <th className="p-2">Start</th>
                                            <th className="p-2">End</th>
                                            <th className="p-2">Cert #</th>
                                            <th className="p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((row) => (
                                            <tr
                                                key={row.index}
                                                className={`border-t border-slate-700/50 ${!row.isValid ? 'bg-red-950/20' : ''}`}
                                            >
                                                <td className="p-2 text-slate-400">{row.index}</td>
                                                <td className="p-2">
                                                    {row.isValid ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIndices.has(row.index)}
                                                            onChange={() => toggleRow(row.index)}
                                                            className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-500">—</span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-white">{row.data.participantName || '—'}</td>
                                                <td className="p-2 text-slate-400">{row.data.participantEmail || '—'}</td>
                                                <td className="p-2 text-slate-300">{row.data.eventName || '—'}</td>
                                                <td className="p-2 text-slate-400">{row.data.eventStartDate || '—'}</td>
                                                <td className="p-2 text-slate-400">{row.data.eventEndDate || '—'}</td>
                                                <td className="p-2 text-cyan-400 font-mono">{row.data.certificateNumber || '—'}</td>
                                                <td className="p-2">
                                                    {row.isValid ? (
                                                        <span className="flex items-center gap-1 text-green-400">
                                                            <CheckCircle2 className="w-4 h-4" /> Valid
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-400" title={row.errors.join(', ')}>
                                                            <AlertCircle className="w-4 h-4" /> {row.errors[0] || 'Invalid'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('upload')}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={selectedIndices.size === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    Generate {selectedIndices.size} certificate(s)
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
                            <p className="text-lg font-medium text-white mb-2">Generating certificates...</p>
                            <p className="text-slate-400">
                                Processing batch {progress.current} of {progress.total}
                            </p>
                            <div className="mt-4 flex gap-4 text-sm">
                                <span className="text-green-400">Success: {progress.successes}</span>
                                <span className="text-red-400">Failed: {progress.failures}</span>
                            </div>
                            <p className="mt-8 text-xs text-slate-500">Do not close this window.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
