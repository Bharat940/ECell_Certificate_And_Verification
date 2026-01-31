'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Info, ArrowLeft, Calendar, User, Hash, Download, ExternalLink, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateRange } from '@/lib/dateUtils';

interface VerifyPageProps {
    params: Promise<{
        certificateNumber: string;
    }>;
}

interface CertificateData {
    valid: boolean;
    certificate?: {
        certificateNumber: string;
        participantName: string;
        certificateUrl: string;
        event: {
            title: string;
            startDate: string;
            endDate: string;
            organizer: string;
        };
        issuedAt: string;
        verificationHash: string;
    };
    message?: string;
    error?: string;
}

export default function VerifyPage({ params }: VerifyPageProps) {
    const [certificateNumber, setCertificateNumber] = useState('');
    const [data, setData] = useState<CertificateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        params.then(({ certificateNumber: certNum }) => {
            setCertificateNumber(certNum);
            verifyCertificate(certNum);
        });
    }, [params]);

    const verifyCertificate = async (certNum: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/verify/${certNum}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Failed to verify certificate');
            setData({
                valid: false,
                error: 'Failed to verify certificate',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>

            {/* Accent glow effects */}
            <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-3xl relative z-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight px-4">
                        Certificate Verification
                    </h1>
                    <div className="inline-flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-slate-800 flex-wrap justify-center">
                        <span className="text-slate-400 text-xs sm:text-sm">Certificate Number:</span>
                        <span className="font-mono text-blue-400 font-semibold tracking-wider text-sm sm:text-base">{certificateNumber}</span>
                        <button
                            onClick={() => copyToClipboard(certificateNumber, 'Certificate number')}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1 p-1"
                            title="Copy certificate number"
                            aria-label="Copy certificate number"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Verification Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-800/50">
                    {isLoading ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                            <p className="text-slate-400">Verifying certificate...</p>
                        </div>
                    ) : data?.valid ? (
                        <div className="space-y-8">
                            {/* Success Icon */}
                            <div className="flex justify-center">
                                <div className="w-28 h-28 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-900/50">
                                    <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2} />
                                </div>
                            </div>

                            {/* Certificate Details */}
                            <div className="space-y-6 text-center">
                                <h2 className="text-3xl font-bold text-white">
                                    Certificate Verified
                                </h2>

                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6 space-y-4 text-left">
                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-slate-400 text-sm">Participant Name</p>
                                            <p className="text-white font-semibold text-base sm:text-lg break-words">{data.certificate?.participantName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-slate-400 text-sm">Event</p>
                                            <p className="text-white font-semibold break-words">{data.certificate?.event.title}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-slate-400 text-sm">Organized By</p>
                                            <p className="text-white font-semibold">{data.certificate?.event.organizer}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-slate-400 text-sm">Event Date</p>
                                            <p className="text-white font-semibold">
                                                {data.certificate?.event.startDate && data.certificate?.event.endDate &&
                                                    formatDateRange(data.certificate.event.startDate, data.certificate.event.endDate)
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Hash className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-slate-400 text-sm">Issued On</p>
                                            <p className="text-white font-semibold">
                                                {data.certificate?.issuedAt && new Date(data.certificate.issuedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Button */}
                                {data.certificate?.certificateUrl && (
                                    <a
                                        href={data.certificate.certificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-semibold py-3 px-6 sm:px-8 rounded-xl transition-all duration-300 shadow-lg shadow-green-900/30 cursor-pointer text-sm sm:text-base w-full sm:w-auto"
                                    >
                                        <Download className="w-5 h-5 shrink-0" />
                                        <span>Download Certificate PDF</span>
                                    </a>
                                )}
                            </div>

                            {/* PDF Preview */}
                            {data.certificate?.certificateUrl && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-semibold">Certificate Preview</h3>
                                        <a
                                            href={data.certificate.certificateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 cursor-pointer"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Open in new tab
                                        </a>
                                    </div>
                                    <div className="bg-slate-900 rounded-lg overflow-hidden">
                                        <iframe
                                            src={data.certificate.certificateUrl}
                                            className="w-full h-[500px] border-0"
                                            title="Certificate Preview"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center space-y-8">
                            {/* Error Icon */}
                            <div className="flex justify-center">
                                <div className="w-28 h-28 bg-gradient-to-br from-red-600 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-red-900/50">
                                    <XCircle className="w-14 h-14 text-white" strokeWidth={2} />
                                </div>
                            </div>

                            {/* Error Message */}
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold text-white">
                                    Certificate Not Found
                                </h2>
                                <p className="text-slate-400 text-lg">
                                    {data?.message || data?.error || 'This certificate number is not registered in our system.'}
                                </p>
                                <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-6 mt-6 backdrop-blur-sm">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                        <p className="text-red-200 text-sm text-left">
                                            Please verify the certificate number and try again. If you believe this is an error, contact the event organizers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Back Button */}
                    <div className="pt-8 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 border border-slate-700 hover:border-slate-600 cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
