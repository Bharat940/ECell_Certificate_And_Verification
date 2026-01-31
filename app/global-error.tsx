'use client';

import Link from 'next/link';
import { ServerCrash, Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full text-center">
                        {/* Error Icon */}
                        <div className="mb-8 flex justify-center">
                            <div className="relative">
                                <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50">
                                    <ServerCrash className="w-16 h-16 text-white" />
                                </div>
                                <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-red-600 to-orange-600"></div>
                            </div>
                        </div>

                        {/* Error Message */}
                        <div className="mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Critical Error
                            </h1>
                            <p className="text-slate-400 text-lg mb-4">
                                A critical error occurred. Please try refreshing the page.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={reset}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-800/50 cursor-pointer"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Reload Page
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-slate-700 cursor-pointer"
                            >
                                <Home className="w-5 h-5" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
