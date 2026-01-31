import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import Event from '@/models/Event'; // Import to register schema
import { isValidCertificateNumber } from '@/lib/certificateUtils';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        certificateNumber: string;
    }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { certificateNumber } = await params;

        logger.apiRequest('GET', `/api/verify/${certificateNumber}`);

        // Validate certificate number format
        if (!isValidCertificateNumber(certificateNumber)) {
            return NextResponse.json(
                {
                    valid: false,
                    error: 'Invalid certificate number format',
                },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Ensure Event model is registered (required for populate)
        if (!Event) {
            throw new Error('Event model not loaded');
        }

        // Find certificate and populate event details
        const certificate = await Certificate.findOne({
            certificateNumber: certificateNumber.toUpperCase(),
        }).populate('eventId');

        if (!certificate) {
            return NextResponse.json({
                valid: false,
                message: 'Certificate not found',
            });
        }

        // Return certificate details
        logger.apiSuccess('GET', `/api/verify/${certificateNumber}`, {
            valid: true,
            certificateNumber: certificate.certificateNumber
        });

        return NextResponse.json({
            valid: true,
            certificate: {
                certificateNumber: certificate.certificateNumber,
                participantName: certificate.participantName,
                certificateUrl: certificate.certificateUrl,
                event: {
                    title: certificate.eventId.title,
                    startDate: certificate.eventId.startDate,
                    endDate: certificate.eventId.endDate,
                    organizer: certificate.eventId.organizer,
                },
                issuedAt: certificate.issuedAt,
                verificationHash: certificate.verificationHash,
            },
        });
    } catch (error) {
        logger.apiError('GET', `/api/verify/${(await params).certificateNumber}`, error);
        return NextResponse.json(
            {
                valid: false,
                error: 'Failed to verify certificate',
            },
            { status: 500 }
        );
    }
}
