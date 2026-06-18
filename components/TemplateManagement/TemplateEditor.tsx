"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { EditorView } from "@codemirror/view";
import Handlebars from "handlebars";

import EditorHeader from "./Editor/EditorHeader";
import MetadataPanel from "./Editor/MetadataPanel";
import TokenPanel from "./Editor/TokenPanel";
import { SAMPLE_DATA } from "./Editor/constants";

interface TemplateEditorProps {
  initialHtml?: string;
  initialName?: string;
  initialDescription?: string;
  initialCategory?: string;
  initialBackgroundUrl?: string;
  onSave: (data: {
    html: string;
    name: string;
    description: string;
    category: string;
    backgroundUrl?: string;
  }) => Promise<void>;
  onClose: () => void;
  title: string;
}

export default function TemplateEditor({
  initialHtml,
  initialName,
  initialDescription,
  initialCategory,
  initialBackgroundUrl,
  onSave,
  onClose,
  title: headerTitle,
}: TemplateEditorProps) {
  // State
  const [code, setCode] = useState(initialHtml || "");
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [category, setCategory] = useState(initialCategory || "General");
  const [canvasWidth, setCanvasWidth] = useState(1123);
  const [canvasHeight, setCanvasHeight] = useState(794);
  const [backgroundUrl, setBackgroundUrl] = useState(
    initialBackgroundUrl || "",
  );
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [sampleData, setSampleData] = useState(SAMPLE_DATA);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [showSettings, setShowSettings] = useState(false);
  const [isTokenPanelOpen, setIsTokenPanelOpen] = useState(true);
  const [zoom, setZoom] = useState(0.75);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update preview content
  useEffect(() => {
    try {
      const template = Handlebars.compile(code);
      const rendered = template({
        ...sampleData,
        backgroundUrl: backgroundUrl || sampleData.backgroundUrl,
      });

      // Inject resets and ensure it's a full document
      const fullHtml = rendered.includes("<head>")
        ? rendered.replace(
            "</head>",
            `
                    <style>
                        html, body { 
                            margin: 0; 
                            padding: 0; 
                            overflow: hidden; 
                            width: ${canvasWidth}px; 
                            height: ${canvasHeight}px;
                            -webkit-print-color-adjust: exact;
                        }
                    </style>
                </head>`,
          )
        : `<style>html, body { margin: 0; padding: 0; overflow: hidden; width: ${canvasWidth}px; height: ${canvasHeight}px; }</style>${rendered}`;

      setPreviewHtml(fullHtml);
    } catch (e) {
      // Silently fail on syntax errors
    }
  }, [code, backgroundUrl, sampleData, canvasWidth, canvasHeight]);

  // Remove the old iframe injection useEffect
  const handleExport = () => {
    const data = JSON.stringify(
      {
        name,
        description,
        category,
        backgroundUrl,
        canvasWidth,
        canvasHeight,
        html: code,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.html) setCode(data.html);
        if (data.name) setName(data.name);
        if (data.description) setDescription(data.description);
        if (data.category) setCategory(data.category);
        if (data.backgroundUrl) setBackgroundUrl(data.backgroundUrl);
        if (data.canvasWidth) setCanvasWidth(data.canvasWidth);
        if (data.canvasHeight) setCanvasHeight(data.canvasHeight);
      } catch (err) {
        toast.error("Invalid JSON blueprint file");
      }
    };
    reader.readAsText(file);
  };

  const handleSaveClick = async () => {
    if (!name.trim()) {
      setShowSettings(true);
      toast.error("Blueprint name is required");
      return;
    }
    setIsSaving(true);
    try {
      let finalBackgroundUrl = backgroundUrl;

      // If we have a staged file, upload it now
      if (backgroundFile) {
        const formData = new FormData();
        formData.append("file", backgroundFile);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          finalBackgroundUrl = data.url;
        } else {
          throw new Error(data.error || "Failed to upload background image");
        }
      }

      await onSave({
        html: code,
        name,
        description,
        category,
        backgroundUrl: finalBackgroundUrl,
      });

      // Clear staged file after successful save
      setBackgroundFile(null);
      setBackgroundUrl(finalBackgroundUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <EditorHeader
        title={name}
        isSaving={isSaving}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
        onSave={handleSaveClick}
        onExport={handleExport}
        onImport={handleImport}
      />

      <MetadataPanel
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        category={category}
        setCategory={setCategory}
        canvasWidth={canvasWidth}
        setCanvasWidth={setCanvasWidth}
        canvasHeight={canvasHeight}
        setCanvasHeight={setCanvasHeight}
        backgroundUrl={backgroundUrl}
        setBackgroundUrl={setBackgroundUrl}
        setBackgroundFile={setBackgroundFile}
        isVisible={showSettings}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <main
          className={`flex-1 transition-all duration-500 relative ${isTokenPanelOpen ? "mr-80" : "mr-0"}`}
        >
          {/* Editor Surface */}
          <div
            className={`h-full flex flex-col min-w-0 ${activeTab === "editor" ? "visible" : "hidden"}`}
          >
            <div className="flex-1 bg-[#1e1e1e] min-w-0 overflow-y-auto custom-scrollbar">
              <CodeMirror
                value={code}
                height="100%"
                theme={vscodeDark}
                extensions={[htmlLang(), EditorView.lineWrapping]}
                onChange={(value) => setCode(value)}
                className="text-sm font-mono"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  autocompletion: true,
                }}
              />
            </div>
          </div>

          {/* Preview Surface (Persistent Iframe) */}
          <div
            className={`h-full bg-slate-950 flex flex-col relative ${activeTab === "preview" ? "visible" : "hidden"}`}
          >
            {/* Zoom Controls Overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-2.5 rounded-2xl shadow-2xl">
              <button
                onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl font-bold"
              >
                −
              </button>
              <input
                type="range"
                min="0.25"
                max="1.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <button
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl font-bold"
              >
                +
              </button>
              <div className="h-4 w-px bg-white/10 mx-2" />
              <span className="text-[10px] font-black text-slate-300 w-12 tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950/50 selection:bg-none p-12">
              <div className="flex min-w-full min-h-full">
                {/* The Canvas Container */}
                <div
                  className="relative shrink-0 bg-white shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 transition-all duration-300 ease-out cursor-grab active:cursor-grabbing m-auto"
                  style={{
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                >
                  <iframe
                    srcDoc={previewHtml}
                    sandbox="allow-same-origin"
                    className="w-full h-full border-none absolute inset-0"
                    title="Blueprint Preview"
                  />
                  {/* Paper Edge Indicator */}
                  <div className="absolute inset-0 pointer-events-none border border-slate-200/50" />
                </div>
              </div>
            </div>
          </div>
        </main>

        <TokenPanel
          isOpen={isTokenPanelOpen}
          setIsOpen={setIsTokenPanelOpen}
          sampleData={sampleData}
          setSampleData={setSampleData}
        />
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 z-105 bg-black/60 backdrop-blur-xs pointer-events-auto transition-all duration-500"
          onClick={() => setShowSettings(false)}
          style={{ top: "4rem" }}
        />
      )}
    </div>
  );
}
