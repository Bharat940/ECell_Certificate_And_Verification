import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        eventId: string;
    }>;
}

/**
 * GET /api/admin/events/[eventId]/email-template
 * Fetch the configured email template for an event
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    logger.apiRequest('GET', '/api/admin/events/[eventId]/email-template');
    try {
        await requireAdmin(request);
        const { eventId } = await params;
        
        await connectDB();
        const event = await Event.findById(eventId).select('emailTemplate');
        
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            emailTemplate: event.emailTemplate || null,
        });
    } catch (error: any) {
        logger.apiError('GET', '/api/admin/events/[eventId]/email-template', error);
        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch email template' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/events/[eventId]/email-template
 * Update the configured email template for an event
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    logger.apiRequest('PUT', '/api/admin/events/[eventId]/email-template');
    try {
        await requireAdmin(request);
        const { eventId } = await params;
        const body = await request.json();
        const { subject, body: htmlBody } = body;

        // Basic validation
        if (!subject || !htmlBody) {
            return NextResponse.json(
                { error: 'Subject and body are required' },
                { status: 400 }
            );
        }

        await connectDB();
        
        const event = await Event.findByIdAndUpdate(
            eventId,
            {
                emailTemplate: {
                    subject,
                    body: htmlBody
                }
            },
            { new: true, runValidators: true }
        );

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        logger.apiSuccess('PUT', '/api/admin/events/[eventId]/email-template', { eventId });

        return NextResponse.json({
            success: true,
            emailTemplate: event.emailTemplate,
            message: 'Email template updated successfully'
        });
    } catch (error: any) {
        logger.apiError('PUT', '/api/admin/events/[eventId]/email-template', error);
        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
    }
}
