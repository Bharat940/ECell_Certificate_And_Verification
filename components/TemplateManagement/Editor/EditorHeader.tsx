"use client";

import React from "react";
import {
  X,
  Upload,
  FileJson,
  Save,
  Settings,
  ChevronDown,
  Code2,
  Eye,
} from "lucide-react";

interface EditorHeaderProps {
  title: string;
  isSaving: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  activeTab: "editor" | "preview";
  setActiveTab: (tab: "editor" | "preview") => void;
  onClose: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EditorHeader({
  title,
  isSaving,
  showSettings,
  setShowSettings,
  activeTab,
  setActiveTab,
  onClose,
  onSave,
  onExport,
  onImport,
}: EditorHeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md border-b border-white/5 relative z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-white/10 mx-1" />
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all border cursor-pointer ${
            showSettings
              ? "bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
              : "bg-white/5 border-transparent text-slate-300 hover:bg-white/10"
          }`}
        >
          <Settings
            className={`w-4 h-4 transition-transform duration-700 ${showSettings ? "rotate-180" : ""}`}
          />
          <div className="text-left hidden md:block">
            <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
              Configuration
            </div>
            <div className="text-sm font-bold truncate max-w-37.5 leading-none">
              {title || "New Blueprint"}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${showSettings ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Center Section: Tabs */}
      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "editor"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Editor
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "preview"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/40"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="hidden lg:flex bg-white/5 p-1 rounded-xl border border-white/5">
          <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-all text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={onImport}
            />
          </label>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 h-10 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl transition-all text-xs font-black text-white shadow-xl shadow-blue-900/40 active:scale-95 border border-white/10 uppercase tracking-widest cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </header>
  );
}
