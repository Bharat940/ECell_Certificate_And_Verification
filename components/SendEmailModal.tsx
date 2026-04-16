'use client';

import { useState, useEffect } from 'react';
import { X, Mail, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CertificateData {
    id: string;
    participantName: string;
    participantEmail?: string;
    certificateNumber: string;
    certificateUrl: string;
    verificationUrl: string;
    issuedAt: string;
    emailStatus?: 'sent' | 'failed' | 'pending' | null;
}

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    certificates: CertificateData[];
    onSuccess: () => void;
}

export function SendEmailModal({ isOpen, onClose, eventId, certificates, onSuccess }: SendEmailModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [templateError, setTemplateError] = useState<string | null>(null);
    const [template, setTemplate] = useState<{ subject: string; body: string } | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [previewSubject, setPreviewSubject] = useState<string>('');
    
    // Batch processing state
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sendStats, setSendStats] = useState<{ sent: number; failed: number } | null>(null);

    const validCerts = certificates.filter(c => c.participantEmail);
    const missingEmailCount = certificates.length - validCerts.length;
    const previouslySentCount = validCerts.filter(c => c.emailStatus === 'sent').length;
    const [confirmResend, setConfirmResend] = useState(false);

    useEffect(() => {
        if (isOpen && eventId) {
            checkTemplateAndPreparePreview();
        } else {
            resetState();
        }
    }, [isOpen, eventId, certificates]);

    const resetState = () => {
        setIsLoading(true);
        setTemplateError(null);
        setTemplate(null);
        setPreviewHtml('');
        setPreviewSubject('');
        setIsSending(false);
        setProgress(0);
        setSendStats(null);
        setConfirmResend(false);
    };

    const checkTemplateAndPreparePreview = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/events/${eventId}/email-template`, {
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success && data.emailTemplate?.subject && data.emailTemplate?.body) {
                setTemplate(data.emailTemplate);
                generatePreview(data.emailTemplate.subject, data.emailTemplate.body);
            } else {
                setTemplateError("No email template is configured for this event. Please configure one before sending.");
            }
        } catch (error) {
            setTemplateError("Failed to check email template configuration. Please check your network connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const generatePreview = (subjectTemplate: string, bodyTemplate: string) => {
        if (certificates.length === 0) return;
        
        // Use the first certificate as sample for preview
        const sample = certificates[0];
        
        const variables = {
            participantName: sample.participantName,
            eventName: 'Event Name', // Since we don't have event details here, use generic
            eventDate: 'Event Date',
            certificateNumber: sample.certificateNumber,
            verificationLink: sample.verificationUrl,
            certificateLink: sample.certificateUrl,
            issueDate: new Date(sample.issuedAt).toLocaleDateString(),
            organizer: 'Organizer',
        };

        let pBody = bodyTemplate;
        let pSubject = subjectTemplate;

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            pBody = pBody.replace(regex, value || '');
            pSubject = pSubject.replace(regex, value || '');
        }

        setPreviewHtml(pBody);
        // Replace event specific placeholders that couldn't be mapped accurately locally due to missing event context
        setPreviewSubject(pSubject.replace(/{{eventName}}/g, '[Event Name]')); 
        setPreviewHtml(prev => prev.replace(/{{eventName}}/g, '[Event Name]')
                                   .replace(/{{organizer}}/g, '[Organizer]')
                                   .replace(/{{eventDate}}/g, '[Event Date]'));
    };

    const handleSend = async () => {
        if (previouslySentCount > 0 && !confirmResend) {
            toast.error('Please confirm resending to participants who already received the email.');
            return;
        }

        setIsSending(true);
        setSendStats(null);
        setProgress(0);

        const BATCH_SIZE = 5;
        let totalSent = 0;
        let totalFailed = 0;
        
        const idsToSend = validCerts.map(c => c.id);
        const totalBatches = Math.ceil(idsToSend.length / BATCH_SIZE);

        for (let i = 0; i < totalBatches; i++) {
            const batch = idsToSend.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            
            try {
                const res = await fetch('/api/admin/emails/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ certificateIds: batch })
                });

                if (res.ok) {
                    const data = await res.json();
                    totalSent += data.sent || 0;
                    totalFailed += data.failed || 0;
                } else {
                    totalFailed += batch.length;
                }
            } catch (err) {
                totalFailed += batch.length;
            }

            setProgress(Math.round(((i + 1) / totalBatches) * 100));
        }

        setSendStats({ sent: totalSent, failed: totalFailed });
        setIsSending(false);
        onSuccess(); // Refresh table status
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 sm:p-4">
            <div className="bg-slate-900 sm:rounded-2xl p-0 w-full h-[100dvh] sm:h-auto max-w-4xl border-y sm:border border-slate-700/50 shadow-2xl flex flex-col sm:max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {certificates.length === 1 ? 'Preview & Send Email' : `Send Bulk Emails (${certificates.length})`}
                            </h3>
                            <p className="text-sm text-slate-400">Review before dispatching</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSending} className="text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-400">Loading template...</p>
                        </div>
                    ) : templateError ? (
                        <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-6 text-center">
                            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                            <h4 className="text-lg font-bold text-amber-400 mb-2">Template Missing</h4>
                            <p className="text-amber-200/80 mb-6">{templateError}</p>
                            <button onClick={onClose} className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer">
                                Close & Configure Template
                            </button>
                        </div>
                    ) : sendStats ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Dispatch Complete</h2>
                            <div className="flex gap-4 mt-6">
                                <div className="bg-slate-800 rounded-lg p-4 min-w-[120px]">
                                    <div className="text-3xl font-bold text-emerald-400">{sendStats.sent}</div>
                                    <div className="text-sm text-slate-400 mt-1">Sent</div>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4 min-w-[120px]">
                                    <div className="text-3xl font-bold text-red-400">{sendStats.failed}</div>
                                    <div className="text-sm text-slate-400 mt-1">Failed</div>
                                </div>
                            </div>
                            {missingEmailCount > 0 && (
                                <p className="text-amber-400/80 text-sm mt-4">
                                    * {missingEmailCount} skipped due to missing email address.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-h-0">
                            
                            {/* Left Col: Diagnostics & Controls */}
                            <div className="space-y-4">
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <h4 className="font-semibold text-white mb-2">Dispatch Summary</h4>
                                    <ul className="text-sm space-y-2 text-slate-300">
                                        <li className="flex justify-between">
                                            <span>Total Selected:</span>
                                            <span className="font-medium text-white">{certificates.length}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Valid Email Addresses:</span>
                                            <span className="font-medium text-emerald-400">{validCerts.length}</span>
                                        </li>
                                    </ul>
                                </div>

                                {missingEmailCount > 0 && (
                                    <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-sm text-amber-200">
                                            <strong>{missingEmailCount} certificate(s)</strong> do not have an associated email address and will be skipped.
                                        </p>
                                    </div>
                                )}

                                {previouslySentCount > 0 && (
                                    <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4">
                                        <div className="flex gap-3 mb-3">
                                            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                            <p className="text-sm text-blue-200">
                                                <strong>{previouslySentCount} participant(s)</strong> have already received this email.
                                            </p>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer mt-2 bg-blue-900/20 p-2 rounded border border-blue-800/50">
                                            <input 
                                                type="checkbox" 
                                                checked={confirmResend}
                                                onChange={(e) => setConfirmResend(e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-600" 
                                            />
                                            <span className="text-sm text-blue-100 font-medium">Yes, I want to resend the email to them.</span>
                                        </label>
                                    </div>
                                )}

                                {isSending && (
                                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-300">Sending emails...</span>
                                            <span className="text-blue-400 font-bold">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-2">
                                            <div 
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Live Preview */}
                            <div className="flex flex-col border border-slate-700 rounded-xl overflow-hidden bg-slate-50">
                                <div className="bg-slate-200 border-b border-slate-300 p-3 shadow-sm">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Previewing exact email for:</span>
                                    <span className="text-sm text-slate-800 font-medium">{certificates[0]?.participantName || 'Sample User'}</span>
                                </div>
                                <div className="bg-white border-b border-slate-200 p-3">
                                    <span className="text-xs text-slate-500 mr-2">Subject:</span>
                                    <span className="text-sm font-semibold text-slate-800">{previewSubject}</span>
                                </div>
                                <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-white min-h-[250px] md:min-h-[300px]">
                                    <div 
                                        style={{ color: 'black', fontFamily: 'sans-serif' }}
                                        dangerouslySetInnerHTML={{ __html: previewHtml }} 
                                    />
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                        {sendStats ? 'Close' : 'Cancel'}
                    </button>
                    
                    {!templateError && !sendStats && (
                        <button
                            onClick={handleSend}
                            disabled={isSending || validCerts.length === 0 || (previouslySentCount > 0 && !confirmResend)}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all disabled:opacity-50 cursor-pointer font-medium shadow-lg"
                        >
                            <Mail className="w-4 h-4" />
                            {isSending ? 'Sending...' : `Send ${validCerts.length} Email(s)`}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
