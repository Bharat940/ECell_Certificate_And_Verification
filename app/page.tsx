'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Shield } from 'lucide-react';

export default function Home() {
  const [certificateNumber, setCertificateNumber] = useState('');
  const router = useRouter();

  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (certificateNumber.trim()) {
      router.push(`/verify/${certificateNumber.trim().toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>

      {/* Accent glow effects */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight px-4">
            E-Cell Certificate
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 mt-2">
              Verification System
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mt-4 px-4">
            Enter your certificate number to verify authenticity
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800/50 hover:border-blue-900/50 transition-all duration-300">
          <form onSubmit={handleVerify} className="space-y-5 sm:space-y-6">
            <div>
              <label
                htmlFor="certificateNumber"
                className="block text-sm font-semibold text-slate-300 mb-3"
              >
                Certificate Number
              </label>
              <input
                type="text"
                id="certificateNumber"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="ECELL-2025-KD93Q"
                className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase font-mono text-base sm:text-lg tracking-wider"
                required
              />
              <p className="mt-3 text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                Format: ECELL-YYYY-XXXXX
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-800/50 cursor-pointer text-base sm:text-lg"
            >
              Verify Certificate
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-slate-500 text-xs sm:text-sm flex items-center justify-center gap-2 flex-wrap">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>All certificates issued by E-Cell are verifiable through this system</span>
          </p>
        </div>
      </div>
    </main>
  );
}
