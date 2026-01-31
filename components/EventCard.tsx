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
        const start = new Date(event.startDate).toLocaleDateString();
        const end = new Date(event.endDate).toLocaleDateString();
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
        <Link
            href={`/admin/events/${event.id}/certificates`}
            className="block bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all group cursor-pointer"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                        {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateRange()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{event.organizer}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {showActions && onEdit && (
                        <button
                            onClick={handleEdit}
                            className="p-2 bg-blue-600/50 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                            title="Edit event"
                            aria-label="Edit event"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {showActions && onDelete && (
                        <button
                            onClick={handleDelete}
                            className="p-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                            title="Delete event"
                            aria-label="Delete event"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
            </div>
        </Link>
    );
}
