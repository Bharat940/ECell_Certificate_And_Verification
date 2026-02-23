'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Info, ArrowLeft, Calendar, User, Hash, Download, ExternalLink, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateRange } from '@/lib/dateUtils';
import Image from 'next/image';

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
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

            <div className="w-full max-w-3xl relative z-10 mx-auto">
                <div className="flex flex-col items-center mb-8">
                    <div className="mb-8">
                        <Image
                            src="/assets/ECell_Full_Logo.png"
                            alt="E-Cell Logo"
                            width={160}
                            height={60}
                            className="h-10 sm:h-14 w-auto drop-shadow-sm opacity-90"
                            priority
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight px-4">
                            Certificate Verification
                        </h1>
                        <div className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-slate-800 flex-wrap justify-center shadow-sm">
                            <span className="text-slate-400 text-xs sm:text-sm font-medium">Certificate Number:</span>
                            <span className="font-mono text-white font-semibold tracking-wider text-sm sm:text-base">{certificateNumber}</span>
                            {(!data || data.valid || isLoading) && (
                                <button
                                    onClick={() => copyToClipboard(certificateNumber, 'Certificate number')}
                                    className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1 p-1"
                                    title="Copy certificate number"
                                    aria-label="Copy certificate number"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>
                    {isLoading ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                            <p className="text-slate-400">Verifying certificate...</p>
                        </div>
                    ) : data?.valid ? (
                        <div className="space-y-8">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={2} />
                                </div>
                            </div>

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

                                </div>

                                {data.certificate?.certificateUrl && (
                                    <button
                                        onClick={async () => {
                                            if (!data.certificate?.certificateUrl) return;
                                            try {
                                                const toastId = toast.loading('Initiating download...');

                                                const response = await fetch(data.certificate.certificateUrl);
                                                if (!response.ok) throw new Error('Failed to fetch certificate');

                                                const blob = await response.blob();
                                                const blobUrl = window.URL.createObjectURL(blob);

                                                const a = document.createElement('a');
                                                a.style.display = 'none';
                                                a.href = blobUrl;
                                                const safeName = data.certificate.participantName.replace(/[^a-z0-9]/gi, '_');
                                                a.download = `${safeName}_${data.certificate.certificateNumber}.pdf`;

                                                document.body.appendChild(a);
                                                a.click();

                                                window.URL.revokeObjectURL(blobUrl);
                                                document.body.removeChild(a);
                                                toast.success('Download started!', { id: toastId });
                                            } catch (error) {
                                                console.error('Download error:', error);
                                                const attachUrl = data.certificate.certificateUrl.replace('/upload/', '/upload/fl_attachment/');
                                                window.open(attachUrl, '_blank');
                                            }
                                        }}
                                        className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-medium py-3 px-6 sm:px-8 rounded-xl transition-all duration-300 border border-slate-700 hover:border-slate-600 shadow-md cursor-pointer text-sm sm:text-base w-full sm:w-auto mt-4"
                                    >
                                        <Download className="w-4 h-4 shrink-0" />
                                        <span>Download Certificate</span>
                                    </button>
                                )}
                            </div>

                            {data.certificate?.certificateUrl && (
                                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 sm:p-4 mt-8">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3">
                                        <h3 className="text-white font-medium text-sm">Certificate Preview</h3>
                                        <a
                                            href={data.certificate.certificateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 cursor-pointer w-full sm:w-auto bg-slate-800 hover:bg-slate-700 py-1.5 px-3 rounded-lg border border-slate-700"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Open PDF
                                        </a>
                                    </div>
                                    <div className="bg-slate-900 rounded-lg overflow-hidden relative w-full pt-[70%] sm:pt-0 sm:h-[600px] border border-slate-800">
                                        <iframe
                                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(data.certificate.certificateUrl)}&embedded=true`}
                                            className="absolute top-0 left-0 w-full h-full sm:relative sm:w-full sm:h-full border-0"
                                            title="Certificate Preview"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center space-y-8 py-4">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 mb-2">
                                    <XCircle className="w-10 h-10 text-rose-400" strokeWidth={2} />
                                </div>
                            </div>

                            <div className="space-y-4 max-w-lg mx-auto">
                                <h2 className="text-2xl font-bold text-white">
                                    Certificate Not Found
                                </h2>
                                <p className="text-slate-400 text-base">
                                    {data?.message || data?.error || 'This certificate number is not registered in our system.'}
                                </p>
                                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 mt-8 text-left">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-slate-500 shrink-0" />
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Please verify the certificate number carefully. If you believe this is an error and you successfully participated in the event, please contact the E-Cell RGPV team.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
