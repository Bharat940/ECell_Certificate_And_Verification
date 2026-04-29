import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import Event from '@/models/Event'; // Required for model registration/population
import { renderEmailTemplate, sendCertificateEmail, EmailVariables } from '@/lib/email';
import { logger } from '@/lib/logger';

// Force node runtime for nodemailer compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow enough time for batch processing

export async function POST(request: NextRequest) {
    logger.apiRequest('POST', '/api/admin/emails/send');
    try {
        await requireAdmin(request);

        const body = await request.json();
        const { certificateIds } = body as { certificateIds: string[] };

        if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request. certificateIds array is required.' },
                { status: 400 }
            );
        }

        await connectDB();

        // 1. Fetch certificates and aggressively populate event details including the emailTemplate
        const certificates = await Certificate.find({ _id: { $in: certificateIds } })
            .populate<{ eventId: any }>('eventId');

        let successCount = 0;
        let failureCount = 0;
        const errors: Array<{ certificateId: string; error: string }> = [];

        const { formatDateRange, formatSingleDate } = await import('@/lib/dateUtils');
        const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');

        // 2. Process each certificate
        for (const cert of certificates) {
            const certIdStr = cert._id.toString();
            const event = cert.eventId;

            try {
                // Pre-flight checks per certificate
                if (!event) {
                    throw new Error('Event data not found for certificate');
                }

                if (!event.emailTemplate || !event.emailTemplate.subject || !event.emailTemplate.body) {
                    throw new Error('No email template configured for this event');
                }

                if (!cert.participantEmail) {
                    throw new Error('Participant has no email address configured');
                }

                // Prepare variable payload for templating
                const variables: EmailVariables = {
                    participantName: cert.participantName,
                    eventName: event.title,
                    eventDate: formatDateRange(event.startDate, event.endDate),
                    certificateNumber: cert.certificateNumber,
                    certificateLink: cert.certificateUrl,
                    verificationLink: `${BASE_URL}/verify/${cert.certificateNumber}`,
                    issueDate: formatSingleDate(cert.issuedAt || new Date()),
                    organizer: event.organizer || 'Event Organizer'
                };

                // Render dynamic Subject and Body
                const subject = renderEmailTemplate(event.emailTemplate.subject, variables);
                const htmlBody = renderEmailTemplate(event.emailTemplate.body, variables);

                // Disptach Email (Nodemailer)
                await sendCertificateEmail(cert.participantEmail, subject, htmlBody);

                // Update database strictly on success
                await Certificate.findByIdAndUpdate(cert._id, {
                    emailSentAt: new Date(),
                    emailStatus: 'sent',
                    emailError: ''
                });

                successCount++;
                logger.info('EMAIL', `Sent certificate email to ${cert.participantEmail}`);
            } catch (error: any) {
                failureCount++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                
                // Track failure on certificate
                await Certificate.findByIdAndUpdate(cert._id, {
                    emailStatus: 'failed',
                    emailError: errorMessage
                });

                errors.push({
                    certificateId: certIdStr,
                    error: errorMessage
                });
                logger.error('EMAIL', `Failed to send email to cert ${certIdStr}`, errorMessage);
            }
        }

        logger.apiSuccess('POST', '/api/admin/emails/send', {
            requested: certificateIds.length,
            sent: successCount,
            failed: failureCount
        });

        return NextResponse.json({
            success: true,
            sent: successCount,
            failed: failureCount,
            total: certificateIds.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        logger.apiError('POST', '/api/admin/emails/send', error);
        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'System error occurred while sending emails' },
            { status: 500 }
        );
    }
}
