'use client';

import { FormEvent } from 'react';
import { X } from 'lucide-react';
import { TEMPLATE_OPTIONS } from '@/lib/templates';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isEditMode: boolean;
    isLoading: boolean;
    error: string;
    formData: {
        title: string;
        startDate: string;
        endDate: string;
        isSingleDay: boolean;
        organizer: string;
        template: string;
    };
    onFormChange: {
        setTitle: (value: string) => void;
        setStartDate: (value: string) => void;
        setEndDate: (value: string) => void;
        setIsSingleDay: (value: boolean) => void;
        setOrganizer: (value: string) => void;
        setTemplate: (value: string) => void;
    };
}

export function EventFormModal({
    isOpen,
    onClose,
    onSubmit,
    isEditMode,
    isLoading,
    error,
    formData,
    onFormChange,
}: EventFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                        {isEditMode ? 'Edit Event' : 'Create New Event'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Event Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => onFormChange.setTitle(e.target.value)}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g., Web Development Workshop"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => onFormChange.setStartDate(e.target.value)}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="singleDay"
                            checked={formData.isSingleDay}
                            onChange={(e) => onFormChange.setIsSingleDay(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="singleDay" className="text-sm text-slate-300">
                            Single day event
                        </label>
                    </div>

                    {!formData.isSingleDay && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => onFormChange.setEndDate(e.target.value)}
                                required={!formData.isSingleDay}
                                min={formData.startDate}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Organizer</label>
                        <input
                            type="text"
                            value={formData.organizer}
                            onChange={(e) => onFormChange.setOrganizer(e.target.value)}
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g., E-Cell"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Certificate Template</label>
                        <select
                            value={formData.template}
                            onChange={(e) => onFormChange.setTemplate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                            {TEMPLATE_OPTIONS.map((template) => (
                                <option key={template.value} value={template.value}>
                                    {template.label} - {template.description}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Choose the certificate design for this event</p>
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-3 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {isEditMode
                                ? (isLoading ? 'Updating...' : 'Update Event')
                                : (isLoading ? 'Creating...' : 'Create Event')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
