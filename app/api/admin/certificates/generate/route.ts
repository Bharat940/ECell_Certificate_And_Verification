/**
 * POST /api/admin/certificates/generate
 * Bulk generate certificates from validated import rows.
 * Uses existing generateCertificatePDF + Cloudinary + MongoDB.
 * Max 20 rows per request; skips duplicates; no background jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import Event from '@/models/Event';
import { generateCertificateNumber } from '@/lib/certificateUtils';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { generateQRCode } from '@/lib/qr';
import { generateCertificatePDF } from '@/lib/pdf';
import { uploadCertificatePDF, isCloudinaryConfigured } from '@/lib/cloudinary';
import type { ImportRowData } from '@/lib/importValidation';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow time for multiple PDFs
export const dynamic = 'force-dynamic';

const MAX_ROWS_PER_REQUEST = 20;

export async function POST(request: NextRequest) {
    logger.apiRequest('POST', '/api/admin/certificates/generate', { context: '[BATCH_IMPORT]' });
    try {
        await requireAdmin(request);

        const body = await request.json();
        const { eventId, rows } = body as { eventId: string; rows: { data: ImportRowData; isValid: boolean }[] };

        if (!eventId || !Array.isArray(rows)) {
            return NextResponse.json(
                { error: 'eventId and rows (array) are required.' },
                { status: 400 }
            );
        }

        const validRows = rows.filter((r) => r.isValid && r.data?.participantName && r.data?.eventName);
        if (validRows.length > MAX_ROWS_PER_REQUEST) {
            return NextResponse.json(
                { error: `Maximum ${MAX_ROWS_PER_REQUEST} rows per request.` },
                { status: 400 }
            );
        }
        if (validRows.length === 0) {
            return NextResponse.json(
                { success: true, generated: 0, failed: 0 }
            );
        }

        if (!isCloudinaryConfigured()) {
            return NextResponse.json(
                { error: 'Cloud storage not configured. Please contact administrator.' },
                { status: 500 }
            );
        }

        await connectDB();
        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        const { formatDateRange, formatSingleDate } = await import('@/lib/dateUtils');
        let generated = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const { data } of validRows) {
            const participantName = data.participantName?.trim() || '';
            const participantEmail = data.participantEmail?.trim() || undefined;
            let certificateNumber = (data.certificateNumber || '').trim().toUpperCase();

            try {
                if (certificateNumber) {
                    const existing = await Certificate.findOne({ certificateNumber });
                    if (existing) {
                        errors.push(`Row "${participantName}": certificate ${certificateNumber} already exists; skipped.`);
                        failed++;
                        continue;
                    }
                } else {
                    let isUnique = false;
                    let attempts = 0;
                    const maxAttempts = 10;
                    while (!isUnique && attempts < maxAttempts) {
                        certificateNumber = generateCertificateNumber();
                        const existing = await Certificate.findOne({ certificateNumber });
                        if (!existing) isUnique = true;
                        attempts++;
                    }
                    if (!isUnique) {
                        errors.push(`Row "${participantName}": could not generate unique certificate number.`);
                        failed++;
                        continue;
                    }
                }

                const qrCodeDataUrl = await generateQRCode(certificateNumber);
                const certificateData = {
                    participantName,
                    eventName: event.title,
                    eventStartDate: formatSingleDate(event.startDate),
                    eventEndDate: formatSingleDate(event.endDate),
                    eventDateRange: formatDateRange(event.startDate, event.endDate),
                    certificateNumber,
                    issueDate: formatSingleDate(new Date()),
                    organizerName: event.organizer,
                    qrCodeDataUrl,
                    templateName: event.template,
                };

                const pdfBuffer = await generateCertificatePDF(certificateData);
                const uploadResult = await uploadCertificatePDF(pdfBuffer, certificateNumber);
                const verificationHash = crypto
                    .createHash('sha256')
                    .update(certificateNumber + event._id.toString())
                    .digest('hex');

                await Certificate.create({
                    certificateNumber,
                    participantName,
                    participantEmail,
                    eventId: event._id,
                    certificateUrl: uploadResult.url,
                    cloudinaryPublicId: uploadResult.publicId,
                    verificationHash,
                    issuedAt: new Date(),
                });
                logger.info('CERT', `[BATCH_IMPORT] Generated ${certificateNumber}`, {
                    participant: participantName,
                    email: participantEmail
                });
                generated++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                errors.push(`Row "${participantName}": ${msg}`);
                failed++;
                logger.error('CERT', '[BATCH_IMPORT] Row failed', { participantName, error: msg });
                errors.push(`Row "${participantName}": ${msg}`);
                failed++;
            }
        }

        logger.apiSuccess('POST', '/api/admin/certificates/generate', {
            context: '[BATCH_IMPORT]',
            generated,
            failed
        });

        return NextResponse.json({
            success: true,
            generated,
            failed,
            ...(errors.length > 0 ? { errors } : {}),
        });
    } catch (error: unknown) {
        logger.apiError('POST', '/api/admin/certificates/generate', error as Error);
        if (error instanceof Error && error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Generate failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
