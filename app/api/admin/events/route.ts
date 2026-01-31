import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { logger } from '@/lib/logger';
import { validateTemplate, isValidTemplateFilename } from '@/lib/templateUtils';

export async function POST(request: NextRequest) {
    logger.apiRequest('POST', '/api/admin/events');
    try {
        // Verify admin authentication
        await requireAdmin(request);

        const body = await request.json();
        const { title, startDate, endDate, organizer, template } = body;

        // Validate required fields
        if (!title || !startDate || !organizer) {
            return NextResponse.json(
                { error: 'Title, start date, and organizer are required' },
                { status: 400 }
            );
        }

        // Set endDate to startDate if not provided (single-day event)
        const eventEndDate = endDate || startDate;

        // Validate template if provided, otherwise use default
        const templateName = template || 'certificate-default.html';

        if (!isValidTemplateFilename(templateName)) {
            return NextResponse.json(
                { error: 'Invalid template selected' },
                { status: 400 }
            );
        }

        // Validate that template file exists
        const templateExists = await validateTemplate(templateName);
        if (!templateExists) {
            return NextResponse.json(
                { error: 'Template file not found' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Create event
        const event = await Event.create({
            title,
            startDate: new Date(startDate),
            endDate: new Date(eventEndDate),
            organizer,
            template: templateName,
        });

        logger.apiSuccess('POST', '/api/admin/events', {
            eventId: event._id,
            title: event.title,
            template: event.template
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
                createdAt: event.createdAt,
            },
        });
    } catch (error: any) {
        logger.apiError('POST', '/api/admin/events', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    logger.apiRequest('GET', '/api/admin/events');
    try {
        // Verify admin authentication
        await requireAdmin(request);

        // Connect to database
        await connectDB();

        // Get all events
        const events = await Event.find().sort({ createdAt: -1 });

        logger.apiSuccess('GET', '/api/admin/events', { count: events.length });
        return NextResponse.json({
            success: true,
            events: events.map(event => ({
                id: event._id,
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                organizer: event.organizer,
                template: event.template,
                createdAt: event.createdAt,
            })),
        });
    } catch (error: any) {
        logger.apiError('GET', '/api/admin/events', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}
