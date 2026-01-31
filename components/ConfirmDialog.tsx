'use client';

import { X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
    isLoading?: boolean;
    requireConfirmText?: string;
    confirmTextValue?: string;
    onConfirmTextChange?: (value: string) => void;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmVariant = 'danger',
    isLoading = false,
    requireConfirmText,
    confirmTextValue = '',
    onConfirmTextChange,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const isConfirmDisabled = isLoading || (requireConfirmText ? confirmTextValue !== requireConfirmText : false);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-slate-300 mb-6 whitespace-pre-line">{message}</p>

                {/* Type-to-confirm input */}
                {requireConfirmText && onConfirmTextChange && (
                    <div className="mb-6">
                        <input
                            type="text"
                            value={confirmTextValue}
                            onChange={(e) => onConfirmTextChange(e.target.value)}
                            placeholder={`Type "${requireConfirmText}" to confirm`}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                            disabled={isLoading}
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isConfirmDisabled}
                        className={`flex-1 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${!isConfirmDisabled ? 'cursor-pointer' : ''
                            } ${confirmVariant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600'
                                : 'bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600'
                            }`}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
