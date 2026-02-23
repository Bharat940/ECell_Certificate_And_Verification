'use client';

import Link from 'next/link';
import { Calendar, User, FileText, Edit, Trash2 } from 'lucide-react';

interface EventCardProps {
    event: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        organizer: string;
        template: string;
    };
    onEdit?: (eventId: string) => void;
    onDelete?: (eventId: string) => void;
    showActions?: boolean;
}

export function EventCard({ event, onEdit, onDelete, showActions = false }: EventCardProps) {
    const formatDateRange = () => {
        const start = new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const end = new Date(event.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        return event.startDate === event.endDate ? start : `${start} - ${end}`;
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit?.(event.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete?.(event.id);
    };

    return (
        <div className="relative group h-full">
            <Link
                href={`/admin/events/${event.id}/certificates`}
                className="block bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-cyan-900/10 transition-all duration-300 h-full flex flex-col cursor-pointer"
            >
                {/* Top Section */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 shadow-inner">
                            <FileText className="w-5 h-5 text-cyan-400 drop-shadow-sm" />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 mt-1">
                            {event.title}
                        </h3>
                    </div>

                    {/* Actions */}
                    {showActions && (
                        <div className="flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            {onEdit && (
                                <button
                                    onClick={handleEdit}
                                    className="p-1.5 sm:p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 hover:border-blue-400 cursor-pointer shadow-sm"
                                    title="Edit event"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="p-1.5 sm:p-2 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 hover:border-red-400 cursor-pointer shadow-sm"
                                    title="Delete event"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80 flex-1 sm:flex-none max-w-full">
                        <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="text-xs text-slate-300 font-medium truncate">{formatDateRange()}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80 flex-1 sm:flex-none max-w-full">
                        <User className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-xs text-slate-300 font-medium truncate">{event.organizer}</span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
