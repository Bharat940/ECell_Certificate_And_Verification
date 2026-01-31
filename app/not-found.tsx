'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                {/* 404 Illustration */}
                <div className="mb-8">
                    <div className="relative inline-block">
                        <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 leading-none">
                            404
                        </h1>
                        <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600"></div>
                    </div>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-slate-400 text-lg mb-2">
                        Oops! The page you're looking for doesn't exist.
                    </p>
                    <p className="text-slate-500">
                        It might have been moved or deleted.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-800/50 cursor-pointer"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-slate-700 cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <p className="text-slate-500 text-sm mb-4">Looking for something?</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            href="/"
                            className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer"
                        >
                            Verify Certificate
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
