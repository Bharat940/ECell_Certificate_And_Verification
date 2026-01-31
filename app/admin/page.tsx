'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
    const [adminKey, setAdminKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminKey }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login failed');
                toast.error(data.error || 'Invalid admin key');
                setIsLoading(false);
                return;
            }

            // Cookie is set automatically by server
            toast.success('Login successful!');
            router.push('/admin/dashboard');
        } catch (err) {
            setError('An error occurred. Please try again.');
            toast.error('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>

            {/* Accent glow effects */}
            <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full mb-4 shadow-lg shadow-blue-900/50">
                        <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Admin Access</h1>
                    <p className="text-slate-400 text-sm sm:text-base">Enter your admin key to continue</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800/50">
                    <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
                        <div>
                            <label
                                htmlFor="adminKey"
                                className="block text-sm font-semibold text-slate-300 mb-3"
                            >
                                Admin Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="adminKey"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                    placeholder="Enter your admin key"
                                    className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-12 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer p-1"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-800/50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-base sm:text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Login
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Back to Home */}
                <div className="mt-5 sm:mt-6 text-center">
                    <a
                        href="/"
                        className="text-slate-400 hover:text-slate-300 text-sm transition-colors cursor-pointer inline-block"
                    >
                        ← Back to Certificate Verification
                    </a>
                </div>
            </div>
        </div>
    );
}
