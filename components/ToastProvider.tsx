'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#1e293b', // slate-800
                    color: '#f1f5f9', // slate-100
                    border: '1px solid #334155', // slate-700
                    borderRadius: '0.75rem',
                    padding: '1rem',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981', // green-500
                        secondary: '#f1f5f9',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444', // red-500
                        secondary: '#f1f5f9',
                    },
                },
                loading: {
                    iconTheme: {
                        primary: '#3b82f6', // blue-500
                        secondary: '#f1f5f9',
                    },
                },
            }}
        />
    );
}
