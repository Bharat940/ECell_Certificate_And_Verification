'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, Eye, Code, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from './ConfirmDialog';

interface EmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
}

const DEFAULT_SUBJECT = 'Your Certificate for {{eventName}}';
const DEFAULT_BODY = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <h2 style="color: #2563eb;">Hello {{participantName}},</h2>
    <p>Thank you for being part of <strong>{{eventName}}</strong>.</p>
    <p>Your official certificate has been generated.</p>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb;">
        <p style="margin: 0 0 10px 0;"><strong>Certificate Number:</strong> {{certificateNumber}}</p>
        <p style="margin: 0;"><strong>Issue Date:</strong> {{issueDate}}</p>
    </div>

    <p style="margin-bottom: 24px;">
        <a href="{{verificationLink}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Certificate
        </a>
    </p>

    <p>If you prefer to download the raw PDF file directly, <a href="{{certificateLink}}">click here</a>.</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
    <p style="color: #64748b; font-size: 14px;">Best regards,<br/>{{organizer}}</p>
</div>`;

const PLACEHOLDERS = [
    { label: 'Participant Name', value: '{{participantName}}' },
    { label: 'Event Name', value: '{{eventName}}' },
    { label: 'Event Date', value: '{{eventDate}}' },
    { label: 'Certificate #', value: '{{certificateNumber}}' },
    { label: 'Verification Link', value: '{{verificationLink}}' },
    { label: 'PDF Link', value: '{{certificateLink}}' },
    { label: 'Issue Date', value: '{{issueDate}}' },
    { label: 'Organizer', value: '{{organizer}}' },
];

export function EmailTemplateModal({ isOpen, onClose, eventId }: EmailTemplateModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const subjectRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body');
    const [originalSubject, setOriginalSubject] = useState('');
    const [originalBody, setOriginalBody] = useState('');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    const hasUnsavedChanges = subject !== originalSubject || body !== originalBody;

    useEffect(() => {
        if (isOpen && eventId) {
            fetchTemplate();
        } else {
            setSubject('');
            setBody('');
            setOriginalSubject('');
            setOriginalBody('');
            setPreviewMode(false);
            setShowExitConfirm(false);
        }
    }, [isOpen, eventId]);

    const fetchTemplate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/events/${eventId}/email-template`, {
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success && data.emailTemplate) {
                setSubject(data.emailTemplate.subject || DEFAULT_SUBJECT);
                setBody(data.emailTemplate.body || DEFAULT_BODY);
                setOriginalSubject(data.emailTemplate.subject || DEFAULT_SUBJECT);
                setOriginalBody(data.emailTemplate.body || DEFAULT_BODY);
            } else {
                // If it doesn't exist, provide the default template
                setSubject(DEFAULT_SUBJECT);
                setBody(DEFAULT_BODY);
                setOriginalSubject(DEFAULT_SUBJECT);
                setOriginalBody(DEFAULT_BODY);
            }
        } catch (error) {
            toast.error('Failed to load email template');
            setSubject(DEFAULT_SUBJECT);
            setBody(DEFAULT_BODY);
            setOriginalSubject(DEFAULT_SUBJECT);
            setOriginalBody(DEFAULT_BODY);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!subject.trim() || !body.trim()) {
            toast.error('Subject and Body are required');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/events/${eventId}/email-template`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ subject, body }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Email template saved successfully!');
                setOriginalSubject(subject);
                setOriginalBody(body);
                onClose();
            } else {
                toast.error(data.error || 'Failed to save template');
            }
        } catch (error) {
            toast.error('Network error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const insertPlaceholder = (placeholderValue: string) => {
        if (lastFocusedField === 'subject' && subjectRef.current) {
            const start = subjectRef.current.selectionStart || 0;
            const end = subjectRef.current.selectionEnd || 0;
            const newText = subject.substring(0, start) + placeholderValue + subject.substring(end);
            setSubject(newText);
            
            // Set focus back after state updates
            setTimeout(() => {
                subjectRef.current?.focus();
                subjectRef.current?.setSelectionRange(start + placeholderValue.length, start + placeholderValue.length);
            }, 0);
        } else if (bodyRef.current) {
            const start = bodyRef.current.selectionStart || 0;
            const end = bodyRef.current.selectionEnd || 0;
            const newText = body.substring(0, start) + placeholderValue + body.substring(end);
            setBody(newText);
            
            setTimeout(() => {
                bodyRef.current?.focus();
                bodyRef.current?.setSelectionRange(start + placeholderValue.length, start + placeholderValue.length);
            }, 0);
        }
    };

    const generatePreviewHTML = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '';
        
        const mockData: Record<string, string> = {
            participantName: 'Alex Carter',
            eventName: 'Tech Bootcamp 2026',
            eventDate: 'October 15, 2026',
            certificateNumber: 'ECELL-2026-XQ123',
            verificationLink: `${baseUrl}/verify/ECELL-2026-XQ123`,
            certificateLink: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
            issueDate: 'October 16, 2026',
            organizer: 'E-Cell RGPV',
        };

        let parsedBody = body;
        for (const [key, value] of Object.entries(mockData)) {
            parsedBody = parsedBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return parsedBody;
    };

    const handleCloseRequest = () => {
        if (hasUnsavedChanges) {
            setShowExitConfirm(true);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 sm:p-4">
            <div className="bg-slate-900 w-full h-[100dvh] sm:h-auto sm:rounded-2xl max-w-5xl border-y sm:border border-slate-700/50 shadow-2xl flex flex-col sm:max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border-b border-slate-800">
                    <div className="pr-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Event Email Template</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Configure the email dispatched with the certificates</p>
                    </div>
                    <button onClick={handleCloseRequest} className="p-1.5 sm:p-2 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800 shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-12 flex justify-center items-center">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                        
                        {/* Left Editor Pane */}
                        <div className={`flex-1 flex flex-col p-4 border-r border-slate-800 min-h-0 overflow-y-auto ${previewMode ? 'hidden md:flex' : 'flex'}`}>
                            
                            {/* Subject */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email Subject</label>
                                <input
                                    ref={subjectRef}
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    onFocus={() => setLastFocusedField('subject')}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Enter email subject..."
                                />
                            </div>

                            {/* Chips (Dropdown) */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Dynamic Tags (Select to insert)</label>
                                <div className="relative">
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                insertPlaceholder(e.target.value);
                                                e.target.value = ''; // reset
                                            }
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Choose a tag to insert --</option>
                                        {PLACEHOLDERS.map((ph) => (
                                            <option key={ph.value} value={ph.value}>
                                                {ph.label} ({ph.value})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            {/* HTML Body */}
                            <div className="flex-1 flex flex-col min-h-[200px] lg:min-h-[300px]">
                                <label className="block text-sm font-medium text-slate-300 mb-1">HTML Body</label>
                                <textarea
                                    ref={bodyRef}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    onFocus={() => setLastFocusedField('body')}
                                    className="w-full flex-1 bg-slate-950/50 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono p-3 focus:outline-none focus:border-blue-500 resize-none"
                                    placeholder="Enter your HTML email body here..."
                                />
                            </div>
                        </div>

                        {/* Right Preview Pane */}
                        <div className={`flex-1 flex flex-col bg-slate-900/50 min-h-[300px] md:min-h-[400px] overflow-hidden ${!previewMode ? 'hidden md:flex' : 'flex'}`}>
                            <div className="bg-slate-800 border-b border-slate-700/50 p-3 px-4 shadow-sm flex items-center justify-between z-10">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Preview (Client View)</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full flex justify-center bg-slate-950/50">
                                <div className="bg-white rounded-lg shadow-lg border border-slate-700 w-full max-w-2xl h-fit overflow-hidden">
                                    <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50">
                                        <p className="text-sm font-medium text-slate-800">
                                            <strong>Subject:</strong> {
                                                (() => {
                                                    let s = subject;
                                                    s = s.replace(/{{eventName}}/g, 'Tech Bootcamp 2026');
                                                    s = s.replace(/{{participantName}}/g, 'Alex Carter');
                                                    return s || '(No Subject)';
                                                })()
                                            }
                                        </p>
                                    </div>
                                    <div 
                                        className="p-4 sm:p-6 text-sm"
                                        style={{ backgroundColor: 'white', color: 'black' }}
                                        dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900 sm:rounded-b-2xl flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setPreviewMode(!previewMode)}
                        className="md:hidden flex justify-center items-center gap-2 px-4 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                        {previewMode ? (
                            <><Code className="w-4 h-4" /> Edit Code</>
                        ) : (
                            <><Eye className="w-4 h-4" /> Preview View</>
                        )}
                    </button>
                    <div className="hidden md:block"></div>

                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                        <button
                            type="button"
                            onClick={handleCloseRequest}
                            disabled={isSaving}
                            className="px-3 sm:px-4 py-2.5 sm:py-2 flex-1 sm:flex-none text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent sm:border-0 hover:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 flex-[2] sm:flex-none bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all disabled:opacity-50 cursor-pointer font-medium"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </div>

            </div>
            
            {/* Unsaved Changes Dialog */}
            <ConfirmDialog
                isOpen={showExitConfirm}
                onClose={() => setShowExitConfirm(false)}
                onConfirm={() => {
                    setShowExitConfirm(false);
                    onClose();
                }}
                title="Discard Unsaved Changes?"
                message="You have unsaved changes in your email template. Are you sure you want to close without saving?"
                confirmText="Discard Changes"
                confirmVariant="danger"
            />
        </div>
    );
}
