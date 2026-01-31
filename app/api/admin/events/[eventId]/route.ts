import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import Certificate from '@/models/Certificate';
import { logger } from '@/lib/logger';
import { validateTemplate, isValidTemplateFilename } from '@/lib/templateUtils';

interface RouteParams {
    params: Promise<{
        eventId: string;
    }>;
}

/**
 * GET /api/admin/events/[eventId]
 * Get a single event by ID
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    logger.apiRequest('GET', '/api/admin/events/[eventId]');
    try {
        await requireAdmin(request);

        const { eventId } = await params;

        await connectDB();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        logger.apiSuccess('GET', '/api/admin/events/[eventId]', { eventId });
        return NextResponse.json({
            success: true,
            event: {
                id: event._id,
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                organizer: event.organizer,
                template: event.template,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
            },
        });
    } catch (error: any) {
        logger.apiError('GET', '/api/admin/events/[eventId]', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/events/[eventId]
 * Update an event
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    logger.apiRequest('PUT', '/api/admin/events/[eventId]');
    try {
        await requireAdmin(request);

        const { eventId } = await params;
        const body = await request.json();
        const { title, startDate, endDate, organizer, template } = body;

        // Validate required fields
        if (!title || !startDate || !organizer) {
            return NextResponse.json(
                { error: 'Title, start date, and organizer are required' },
                { status: 400 }
            );
        }

        // Set endDate to startDate if not provided
        const eventEndDate = endDate || startDate;

        // Validate template if provided
        if (template) {
            if (!isValidTemplateFilename(template)) {
                return NextResponse.json(
                    { error: 'Invalid template selected' },
                    { status: 400 }
                );
            }

            const templateExists = await validateTemplate(template);
            if (!templateExists) {
                return NextResponse.json(
                    { error: 'Template file not found' },
                    { status: 400 }
                );
            }
        }

        await connectDB();

        // Find and update event
        const event = await Event.findByIdAndUpdate(
            eventId,
            {
                title,
                startDate: new Date(startDate),
                endDate: new Date(eventEndDate),
                organizer,
                ...(template && { template }),
            },
            { new: true, runValidators: true }
        );

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        logger.apiSuccess('PUT', '/api/admin/events/[eventId]', {
            eventId,
            title: event.title
        });

        return NextResponse.json({
            success: true,
            event: {
                id: event._id,
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                organizer: event.organizer,
                template: event.template,
                updatedAt: event.updatedAt,
            },
        });
    } catch (error: any) {
        logger.apiError('PUT', '/api/admin/events/[eventId]', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/events/[eventId]
 * Delete an event (only if no certificates exist)
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    logger.apiRequest('DELETE', '/api/admin/events/[eventId]');
    try {
        await requireAdmin(request);

        const { eventId } = await params;

        await connectDB();

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Check if event has any certificates
        const certificateCount = await Certificate.countDocuments({ eventId });
        if (certificateCount > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete event with existing certificates',
                    certificateCount
                },
                { status: 400 }
            );
        }

        // Delete event
        await Event.findByIdAndDelete(eventId);

        logger.apiSuccess('DELETE', '/api/admin/events/[eventId]', {
            eventId,
            title: event.title
        });

        return NextResponse.json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error: any) {
        logger.apiError('DELETE', '/api/admin/events/[eventId]', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
