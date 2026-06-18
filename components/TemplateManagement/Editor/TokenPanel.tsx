"use client";

import React from "react";
import { Copy, Sparkles, BookOpen, ChevronLeft, Check } from "lucide-react";
import type { SampleData } from "./constants";

interface TokenPanelProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sampleData: SampleData;
  setSampleData: (data: SampleData) => void;
}

export default function TokenPanel({
  isOpen,
  setIsOpen,
  sampleData,
  setSampleData,
}: TokenPanelProps) {
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(`{{${token}}}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <>
      {/* Persistent Handle (Always Visible) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 w-8 h-24 bg-slate-800 border border-white/5 border-r-0 rounded-l-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all z-60 cursor-pointer group shadow-2xl ${
          isOpen
            ? "translate-x-full opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100"
        }`}
        title="Open Tokens Panel"
      >
        <ChevronLeft className="w-5 h-5 group-hover:scale-125 transition-transform" />
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`fixed right-0 top-16 bottom-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-white/5 bg-slate-900/95 backdrop-blur-2xl z-55 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${
          isOpen ? "w-80 translate-x-0" : "w-80 translate-x-full"
        }`}
      >
        {/* Close Button (Header of Sidebar) */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Dynamic Tokens
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                Live Playground
              </h3>
            </div>
            {(Object.keys(sampleData) as Array<keyof SampleData>).map((key) => (
              <div key={key} className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <code className="text-[9px] text-blue-400/70 font-bold">
                    {"{{" + key + "}}"}
                  </code>
                  <button
                    onClick={() => handleCopy(key)}
                    className="p-1 hover:bg-blue-600/20 rounded text-slate-500 hover:text-blue-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Copy Token"
                  >
                    {copiedToken === key ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={sampleData[key]}
                  onChange={(e) =>
                    setSampleData({ ...sampleData, [key]: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                  placeholder={`Set ${key}...`}
                />
              </div>
            ))}
          </div>

          {/* Expert Guidelines Section */}
          <div className="pt-8 border-t border-white/5">
            <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Design Guidelines
            </h3>
            <div className="space-y-4">
              {[
                {
                  label: "Print Layout",
                  desc: "Use @page { size: A4 landscape; margin: 0; } for consistent PDF output.",
                  code: "@page { size: A4 landscape; }",
                },
                {
                  label: "Safe Zones",
                  desc: "Keep critical content 40px away from edges to avoid printer cutoff.",
                  code: "padding: 40px;",
                },
                {
                  label: "Verification",
                  desc: "Always include the {{qrCodeDataUrl}} for instant authenticity verification.",
                  code: 'img src="{{qrCodeDataUrl}}"',
                },
              ].map((guide, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-300 uppercase leading-none">
                    {guide.label}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    {guide.desc}
                  </p>
                  <div className="p-2 bg-black/40 rounded-lg border border-white/5 font-mono text-[9px] text-blue-400">
                    {guide.code}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
