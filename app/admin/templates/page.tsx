'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Layout, Edit2, Trash2, Archive, FileCode, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
const TemplateEditor = dynamic(() => import('@/components/TemplateManagement/TemplateEditor'), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    )
});

interface Template {
    _id: string;
    name: string;
    description: string;
    html: string;
    category: string;
    backgroundUrl?: string;
    isArchived: boolean;
    updatedAt: string;
}

const DEFAULT_STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Old+Standard+TT:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @page { size: A4 landscape; margin: 0; }
        body {
            width: 1123px;
            height: 794px;
            margin: 0;
            padding: 40px;
            font-family: 'Montserrat', sans-serif;
            background: linear-gradient(rgba(248, 250, 252, 0.9), rgba(226, 232, 240, 0.9)), url('{{backgroundUrl}}');
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 20px solid #1e293b;
            position: relative;
        }
        .content { text-align: center; }
        h1 { font-size: 60px; color: #1e293b; margin-bottom: 20px; }
        .subtitle { font-size: 24px; color: #64748b; margin-bottom: 60px; }
        .name { font-size: 50px; font-weight: bold; color: #2563eb; margin-bottom: 20px; }
        .event { font-size: 20px; color: #475569; }
        .qr-section { position: absolute; bottom: 60px; right: 60px; text-align: center; }
        .qr-code { width: 100px; height: 100px; }
        .cert-id { font-size: 10px; color: #94a3b8; margin-top: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="content">
        <h1>CERTIFICATE</h1>
        <div class="subtitle">OF APPRECIATION</div>
        <div class="subtitle" style="margin-bottom: 20px;">Proudly Presented To</div>
        <div class="name">{{participantName}}</div>
        <div class="event">for successfully participating in <strong>{{eventName}}</strong></div>
        <div class="event" style="margin-top: 10px;">issued on {{issueDate}} by {{organizerName}}</div>
    </div>
    <div class="qr-section">
        <img src="{{qrCodeDataUrl}}" class="qr-code" />
        <div class="cert-id">{{certificateNumber}}</div>
    </div>
</body>
</html>`;

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/templates');
            const data = await res.json();
            if (data.success) {
                setTemplates(data.templates);
            }
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleSave = async (data: { html: string; name: string; description: string; category: string; backgroundUrl?: string }) => {
        const payload = {
            name: data.name,
            description: data.description,
            html: data.html,
            category: data.category,
            backgroundUrl: data.backgroundUrl
        };

        try {
            const url = editingTemplate 
                ? `/api/admin/templates/${editingTemplate._id}` 
                : '/api/admin/templates';
            
            const res = await fetch(url, {
                method: editingTemplate ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingTemplate ? 'Template updated' : 'Template created');
                setIsEditorOpen(false);
                fetchTemplates();
            } else {
                toast.error(data.error || 'Failed to save');
            }
        } catch (error) {
            toast.error('Network error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Template moved to archive');
                fetchTemplates();
            }
        } catch (error) {
            toast.error('Failed to archive');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/templates/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: false })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Template restored to active');
                fetchTemplates();
            }
        } catch (error) {
            toast.error('Failed to restore');
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesArchiveStatus = t.isArchived === showArchived;
        return matchesSearch && matchesArchiveStatus;
    });

    return (
        <div className="min-h-screen bg-slate-950 p-8 pt-12">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Certificate Blueprints</h1>
                        <p className="text-slate-400">Manage and design your event certificate templates</p>
                    </div>
                    <button 
                        onClick={handleCreate}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Blueprint
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search templates by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-text"
                        />
                    </div>
                    <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                        <button 
                            onClick={() => setShowArchived(false)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                !showArchived ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Active
                        </button>
                        <button 
                            onClick={() => setShowArchived(true)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                showArchived ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Archived
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-900/20 border border-slate-800/50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-slate-800/50 border-dashed">
                        <Layout className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300">No blueprints found</h3>
                        <p className="text-slate-500 mt-2">Start by creating your first certificate design</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTemplates.map(template => (
                            <div 
                                key={template._id}
                                className="group relative bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-blue-900/10"
                            >
                                {/* Preview Card */}
                                <div className="h-48 bg-slate-800/50 flex items-center justify-center border-b border-slate-800 relative overflow-hidden">
                                    <FileCode className="w-12 h-12 text-slate-700 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/20">
                                            {template.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-slate-100 mb-2 truncate">{template.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">{template.description}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
                                        <span className="text-[10px] text-slate-600 font-medium">
                                            Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEdit(template)}
                                                className="p-2 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg transition-all cursor-pointer"
                                                title="Edit Template"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {template.isArchived ? (
                                                <button 
                                                    onClick={() => handleRestore(template._id)}
                                                    className="p-2 bg-slate-800 hover:bg-green-600/20 hover:text-green-400 rounded-lg transition-all cursor-pointer"
                                                    title="Restore Template"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleDelete(template._id)}
                                                    className="p-2 bg-slate-800 hover:bg-orange-600/20 hover:text-orange-400 rounded-lg transition-all cursor-pointer"
                                                    title="Archive Template"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Template Editor Fullscreen */}
            {isEditorOpen && (
                <TemplateEditor 
                    title={editingTemplate?.name || 'New Blueprint'}
                    initialHtml={editingTemplate?.html || DEFAULT_STARTER_HTML}
                    initialName={editingTemplate?.name || ''}
                    initialDescription={editingTemplate?.description || ''}
                    initialCategory={editingTemplate?.category || 'General'}
                    initialBackgroundUrl={editingTemplate?.backgroundUrl || ''}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
