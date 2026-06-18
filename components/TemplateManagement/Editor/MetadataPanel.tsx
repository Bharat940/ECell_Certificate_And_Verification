"use client";

import React from "react";
import { Tag, FileText, FolderTree, Upload } from "lucide-react";

interface MetadataPanelProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  canvasWidth: number;
  setCanvasWidth: (val: number) => void;
  canvasHeight: number;
  setCanvasHeight: (val: number) => void;
  backgroundUrl: string;
  setBackgroundUrl: (val: string) => void;
  setBackgroundFile: (file: File | null) => void;
  isVisible: boolean;
}

export default function MetadataPanel({
  name,
  setName,
  description,
  setDescription,
  category,
  setCategory,
  canvasWidth,
  setCanvasWidth,
  canvasHeight,
  setCanvasHeight,
  backgroundUrl,
  setBackgroundUrl,
  setBackgroundFile,
  isVisible,
}: MetadataPanelProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  return (
    <div
      className={`relative z-110 bg-slate-900 border-b border-white/10 px-8 transition-all duration-500 ease-in-out overflow-hidden shadow-2xl ${
        isVisible
          ? "max-h-125 py-8 opacity-100"
          : "max-h-0 py-0 opacity-0 border-none"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">
              <Tag className="w-3 h-3" />
              Blueprint Identity
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modern Professional 2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">
              <FileText className="w-3 h-3" />
              Strategic Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly explain the design intent..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">
              <FolderTree className="w-3 h-3" />
              Blueprint Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-all appearance-none cursor-pointer"
                style={{ colorScheme: "dark" }}
              >
                <option value="General" className="bg-slate-950 text-white">
                  General
                </option>
                <option
                  value="Participation"
                  className="bg-slate-950 text-white"
                >
                  Participation
                </option>
                <option
                  value="Appreciation"
                  className="bg-slate-950 text-white"
                >
                  Appreciation
                </option>
                <option value="Merit" className="bg-slate-950 text-white">
                  Merit
                </option>
                <option value="Custom" className="bg-slate-950 text-white">
                  Custom
                </option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Tag className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Resolution & Visuals Section */}
        <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex items-center gap-6">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Workspace Size
            </label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <div className="flex items-center gap-2 px-3 border-r border-white/10">
                <span className="text-[9px] font-bold text-slate-500">W</span>
                <input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) =>
                    setCanvasWidth(parseInt(e.target.value) || 0)
                  }
                  className="w-14 bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-r border-white/10">
                <span className="text-[9px] font-bold text-slate-500">H</span>
                <input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) =>
                    setCanvasHeight(parseInt(e.target.value) || 0)
                  }
                  className="w-14 bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setCanvasWidth(1123);
                  setCanvasHeight(794);
                }}
                className="px-3 py-1 hover:bg-white/10 rounded-lg text-[8px] font-bold text-blue-400 transition-all uppercase tracking-widest"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Background URL
            </label>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl p-1 group focus-within:border-blue-500 transition-all">
                <input
                  type="text"
                  value={backgroundUrl}
                  onChange={(e) => {
                    setBackgroundUrl(e.target.value);
                    setBackgroundFile(null); // Clear staged file if manually entering URL
                  }}
                  placeholder="Cloudinary or direct image link..."
                  className="flex-1 bg-transparent px-3 py-1 text-xs text-white focus:outline-none placeholder:text-slate-700"
                />
              </div>
              <label className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-900/20 active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                Stage Image
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Create a local URL for instant preview
                    const localUrl = URL.createObjectURL(file);
                    setBackgroundUrl(localUrl);
                    setBackgroundFile(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
