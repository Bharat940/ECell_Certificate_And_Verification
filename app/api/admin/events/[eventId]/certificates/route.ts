import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import Event from '@/models/Event';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        eventId: string;
    }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    logger.apiRequest('GET', '/api/admin/events/[eventId]/certificates');
    try {
        // Verify admin authentication
        await requireAdmin(request);

        const { eventId } = await params;

        // Connect to database
        await connectDB();

        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        // Get all certificates for this event
        const certificates = await Certificate.find({ eventId })
            .sort({ issuedAt: -1 })
            .select('certificateNumber participantName certificateUrl issuedAt verificationHash');

        logger.apiSuccess('GET', '/api/admin/events/[eventId]/certificates', {
            eventId,
            count: certificates.length
        });

        return NextResponse.json({
            success: true,
            event: {
                id: event._id,
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                organizer: event.organizer,
            },
            certificates: certificates.map(cert => ({
                id: cert._id,
                certificateNumber: cert.certificateNumber,
                participantName: cert.participantName,
                certificateUrl: cert.certificateUrl,
                issuedAt: cert.issuedAt,
                verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${cert.certificateNumber}`,
            })),
        });
    } catch (error: any) {
        logger.apiError('GET', '/api/admin/events/[eventId]/certificates', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch certificates' },
            { status: 500 }
        );
    }
}
