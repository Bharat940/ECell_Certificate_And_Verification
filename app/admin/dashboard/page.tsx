'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { EventCard } from '@/components/EventCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EventFormModal } from '@/components/EventFormModal';
import { CertificateFormModal } from '@/components/CertificateFormModal';

interface Event {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    organizer: string;
    template: string;
}

interface GeneratedCertificate {
    certificateNumber: string;
    participantName: string;
    certificateUrl: string;
    verificationUrl: string;
}

export default function AdminDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showCertForm, setShowCertForm] = useState(false);
    const [generatedCert, setGeneratedCert] = useState<GeneratedCertificate | null>(null);
    const router = useRouter();

    // Event form state
    const [eventTitle, setEventTitle] = useState('');
    const [eventStartDate, setEventStartDate] = useState('');
    const [eventEndDate, setEventEndDate] = useState('');
    const [isSingleDay, setIsSingleDay] = useState(true);
    const [eventOrganizer, setEventOrganizer] = useState('E-Cell');
    const [eventTemplate, setEventTemplate] = useState('certificate-default.html');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [eventError, setEventError] = useState('');

    // Event edit/delete state
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
    const [isDeletingEvent, setIsDeletingEvent] = useState(false);

    // Certificate form state
    const [selectedEventId, setSelectedEventId] = useState('');
    const [participantName, setParticipantName] = useState('');
    const [participantEmail, setParticipantEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [certError, setCertError] = useState('');

    useEffect(() => {
        fetchEvents();
    }, [router]);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/admin/events', {
                credentials: 'include',
            });

            if (response.status === 401) {
                router.push('/admin');
                return;
            }

            const data = await response.json();
            if (data.success) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include',
            });
            toast.success('Logged out successfully');
            router.push('/admin');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Logout failed');
            router.push('/admin');
        }
    };

    const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEventError('');
        setIsCreatingEvent(true);

        try {
            const response = await fetch('/api/admin/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: eventTitle,
                    startDate: eventStartDate,
                    endDate: isSingleDay ? eventStartDate : eventEndDate,
                    organizer: eventOrganizer,
                    template: eventTemplate,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Reset form
                setEventTitle('');
                setEventStartDate('');
                setEventEndDate('');
                setIsSingleDay(true);
                setEventOrganizer('E-Cell');
                setEventTemplate('certificate-default.html');
                setShowEventForm(false);
                // Refresh events list
                await fetchEvents();
                toast.success('Event created successfully!');
            } else {
                setEventError(data.error || 'Failed to create event');
                toast.error(data.error || 'Failed to create event');
            }
        } catch (error) {
            setEventError('Network error. Please try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setIsCreatingEvent(false);
        }
    };

    const handleGenerateCertificate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCertError('');
        setIsGenerating(true);

        try {
            const response = await fetch('/api/admin/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    eventId: selectedEventId,
                    participantName: participantName,
                    participantEmail: participantEmail || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const cert = data.certificate;
                setGeneratedCert({
                    certificateNumber: cert.certificateNumber,
                    participantName: cert.participantName,
                    certificateUrl: cert.certificateUrl,
                    verificationUrl: `${window.location.origin}/verify/${cert.certificateNumber}`,
                });
                // Reset form
                setParticipantName('');
                setParticipantEmail('');
                setSelectedEventId('');
                toast.success('Certificate generated successfully!');
            } else {
                setCertError(data.error || 'Failed to generate certificate');
                toast.error(data.error || 'Failed to generate certificate');
            }
        } catch (error) {
            setCertError('Network error. Please try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const handleEditEvent = (eventId: string) => {
        const event = events.find(e => e.id === eventId);
        if (event) {
            setEditingEventId(eventId);
            setEventTitle(event.title);

            // Safely parse dates - handle both ISO strings and date-only strings
            const startDate = event.startDate ? (event.startDate.includes('T') ? event.startDate.split('T')[0] : event.startDate) : '';
            const endDate = event.endDate ? (event.endDate.includes('T') ? event.endDate.split('T')[0] : event.endDate) : '';

            setEventStartDate(startDate);
            setEventEndDate(endDate);
            setIsSingleDay(event.startDate === event.endDate);
            setEventOrganizer(event.organizer || 'E-Cell');
            setEventTemplate(event.template || 'certificate-default.html');
            setShowEventForm(true);
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingEventId) return;

        setEventError('');
        setIsUpdatingEvent(true);

        try {
            const response = await fetch(`/api/admin/events/${editingEventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: eventTitle,
                    startDate: eventStartDate,
                    endDate: isSingleDay ? eventStartDate : eventEndDate,
                    organizer: eventOrganizer,
                    template: eventTemplate,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                closeEventForm();
                setEditingEventId(null);
                await fetchEvents();
                toast.success('Event updated successfully!');
            } else {
                setEventError(data.error || 'Failed to update event');
                toast.error(data.error || 'Failed to update event');
            }
        } catch (error) {
            setEventError('Network error. Please try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setIsUpdatingEvent(false);
        }
    };

    const handleDeleteEvent = (eventId: string) => {
        setDeletingEventId(eventId);
    };

    const confirmDeleteEvent = async () => {
        if (!deletingEventId) return;

        setIsDeletingEvent(true);

        try {
            const response = await fetch(`/api/admin/events/${deletingEventId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setDeletingEventId(null);
                await fetchEvents();
                toast.success('Event deleted successfully!');
            } else {
                toast.error(data.error || 'Failed to delete event');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setIsDeletingEvent(false);
        }
    };

    const closeEventForm = () => {
        setShowEventForm(false);
        setEditingEventId(null);
        setEventError('');
        setEventTitle('');
        setEventStartDate('');
        setEventEndDate('');
        setIsSingleDay(true);
        setEventOrganizer('E-Cell');
        setEventTemplate('certificate-default.html');
    };

    const closeCertForm = () => {
        setShowCertForm(false);
        setCertError('');
        setGeneratedCert(null);
        setParticipantName('');
        setParticipantEmail('');
        setSelectedEventId('');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-white rounded-lg transition-all border border-slate-700 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <button
                            onClick={() => setShowEventForm(true)}
                            className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 hover:border-blue-900/50 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Create Event</h3>
                                    <p className="text-slate-400 text-sm">Add a new event to the system</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setShowCertForm(true)}
                            disabled={events.length === 0}
                            className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 hover:border-cyan-900/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Generate Certificate</h3>
                                    <p className="text-slate-400 text-sm">
                                        {events.length === 0 ? 'Create an event first' : 'Create a new certificate'}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Events List */}
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
                        <h2 className="text-xl font-bold text-white mb-4">Recent Events</h2>
                        {isLoading ? (
                            <p className="text-slate-400">Loading events...</p>
                        ) : events.length === 0 ? (
                            <p className="text-slate-400">No events yet. Create your first event!</p>
                        ) : (
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onEdit={handleEditEvent}
                                        onDelete={handleDeleteEvent}
                                        showActions={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Event Form Modal */}
            <EventFormModal
                isOpen={showEventForm}
                onClose={closeEventForm}
                onSubmit={editingEventId ? handleUpdateEvent : handleCreateEvent}
                isEditMode={!!editingEventId}
                isLoading={isCreatingEvent || isUpdatingEvent}
                error={eventError}
                formData={{
                    title: eventTitle,
                    startDate: eventStartDate,
                    endDate: eventEndDate,
                    isSingleDay: isSingleDay,
                    organizer: eventOrganizer,
                    template: eventTemplate,
                }}
                onFormChange={{
                    setTitle: setEventTitle,
                    setStartDate: setEventStartDate,
                    setEndDate: setEventEndDate,
                    setIsSingleDay: setIsSingleDay,
                    setOrganizer: setEventOrganizer,
                    setTemplate: setEventTemplate,
                }}
            />

            {/* Certificate Form Modal */}
            <CertificateFormModal
                isOpen={showCertForm}
                onClose={closeCertForm}
                onSubmit={handleGenerateCertificate}
                isLoading={isGenerating}
                error={certError}
                events={events}
                formData={{
                    selectedEventId: selectedEventId,
                    participantName: participantName,
                    participantEmail: participantEmail,
                }}
                onFormChange={{
                    setSelectedEventId: setSelectedEventId,
                    setParticipantName: setParticipantName,
                    setParticipantEmail: setParticipantEmail,
                }}
                generatedCert={generatedCert}
                onCopyToClipboard={copyToClipboard}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deletingEventId !== null}
                onClose={() => setDeletingEventId(null)}
                onConfirm={confirmDeleteEvent}
                title="Delete Event?"
                message="Are you sure you want to delete this event? This action can only be performed if the event has no certificates."
                confirmText="Delete"
                confirmVariant="danger"
                isLoading={isDeletingEvent}
            />
        </div>
    );
}
