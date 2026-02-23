'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Shield, QrCode } from 'lucide-react';

import Image from 'next/image';
import { QRScannerModal } from '@/components/QRScannerModal';

export default function Home() {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const router = useRouter();

  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (certificateNumber.trim()) {
      router.push(`/verify/${certificateNumber.trim().toUpperCase()}`);
    }
  };

  const handleScanResult = (result: string) => {
    setIsScannerOpen(false);
    try {
      // If the QR code is a full verification URL, parse the pathname
      const url = new URL(result);
      const urlParts = url.pathname.split('/');
      const code = urlParts[urlParts.length - 1];
      if (code) {
        router.push(`/verify/${code.toUpperCase()}`);
      } else {
        router.push(`/verify/${result.toUpperCase()}`);
      }
    } catch {
      // If it's not a URL, assume it's just the certificate code String itself
      router.push(`/verify/${result.toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle organic background pattern in dark mode */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

      <div className="w-full max-w-xl relative z-10 mx-auto">

        {/* Verification Card - Clean, solid design but dark */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-800 relative overflow-hidden">

          {/* Subtle top decoration bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>

          {/* Logo Section */}
          <div className="flex justify-center mb-6 sm:mb-10">
            <Image
              src="/assets/ECell_Full_Logo.png"
              alt="E-Cell RGPV Logo"
              width={200}
              height={80}
              className="object-contain w-32 sm:w-40 md:w-52"
              priority
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              Certificate Verification
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-3">
              Enter your unique certificate number below to securely verify its authenticity.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label
                htmlFor="certificateNumber"
                className="block text-sm font-semibold text-slate-300 mb-2 ml-1"
              >
                Certificate Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="certificateNumber"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="e.g. ECELL-2025-ABCD1"
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-950/50 border border-slate-700 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all uppercase font-mono tracking-wide text-sm sm:text-lg"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-blue-900/20 cursor-pointer text-base sm:text-lg flex justify-center items-center gap-2 group border border-blue-500/20"
            >
              Verify Credential
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-slate-500 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full bg-slate-800/80 hover:bg-slate-700 text-white font-medium py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-md cursor-pointer text-base sm:text-lg flex justify-center items-center gap-3 border border-slate-700"
          >
            <QrCode className="w-5 h-5 text-blue-400" />
            Scan QR Code
          </button>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Official certificates issued by E-Cell RGPV</span>
            </p>
          </div>
        </div>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />
    </main>
  );
}
