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

// Force Node.js runtime (required for Puppeteer)
export const runtime = 'nodejs';
export const maxDuration = 10; // Vercel Hobby plan limit (Pro allows up to 60s)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    logger.apiRequest('POST', '/api/admin/certificates');
    try {
        // Verify admin authentication
        await requireAdmin(request);

        const body = await request.json();
        const { eventId, participantName, participantEmail } = body;

        // Validate required fields
        if (!eventId || !participantName) {
            return NextResponse.json(
                { error: 'Event ID and participant name are required' },
                { status: 400 }
            );
        }

        // Validate Cloudinary configuration
        if (!isCloudinaryConfigured()) {
            logger.error('PDF', 'Cloudinary not configured');
            return NextResponse.json(
                { error: 'Cloud storage not configured. Please contact administrator.' },
                { status: 500 }
            );
        }

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

        // Generate unique certificate number
        let certificateNumber = '';
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            certificateNumber = generateCertificateNumber();
            const existing = await Certificate.findOne({ certificateNumber });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return NextResponse.json(
                { error: 'Failed to generate unique certificate number' },
                { status: 500 }
            );
        }

        logger.info('CERT', 'Generating certificate', {
            certificateNumber,
            participantName,
            eventId
        });

        // Step 1: Generate QR Code
        const qrCodeDataUrl = await generateQRCode(certificateNumber);
        logger.success('CERT', 'QR code generated');

        // Step 2: Prepare certificate data with multi-day event support
        const { formatDateRange, formatSingleDate } = await import('@/lib/dateUtils');

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

        // Step 3: Generate PDF
        const pdfBuffer = await generateCertificatePDF(certificateData);
        logger.success('CERT', 'PDF generated', {
            size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
        });

        // Step 4: Upload to Cloudinary
        const uploadResult = await uploadCertificatePDF(pdfBuffer, certificateNumber);
        logger.success('CERT', 'PDF uploaded to cloud', { url: uploadResult.url });

        // Step 5: Generate verification hash
        const verificationHash = crypto
            .createHash('sha256')
            .update(certificateNumber + event._id.toString())
            .digest('hex');

        // Step 6: Save to database
        const certificate = await Certificate.create({
            certificateNumber,
            participantName,
            participantEmail: participantEmail || undefined,
            eventId: event._id,
            certificateUrl: uploadResult.url,
            cloudinaryPublicId: uploadResult.publicId,
            verificationHash,
            issuedAt: new Date(),
        });

        // Populate event details
        await certificate.populate('eventId');

        logger.apiSuccess('POST', '/api/admin/certificates', {
            certificateNumber: certificate.certificateNumber,
            eventId
        });

        return NextResponse.json({
            success: true,
            certificate: {
                id: certificate._id,
                certificateNumber: certificate.certificateNumber,
                participantName: certificate.participantName,
                certificateUrl: certificate.certificateUrl,
                event: {
                    id: event._id,
                    title: event.title,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    organizer: event.organizer,
                },
                verificationHash: certificate.verificationHash,
                issuedAt: certificate.issuedAt,
            },
        });
    } catch (error: any) {
        logger.apiError('POST', '/api/admin/certificates', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create certificate', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    logger.apiRequest('GET', '/api/admin/certificates');
    try {
        // Verify admin authentication
        await requireAdmin(request);

        // Connect to database
        await connectDB();

        // Get all certificates with event details
        const certificates = await Certificate.find()
            .populate('eventId')
            .sort({ issuedAt: -1 });

        logger.apiSuccess('GET', '/api/admin/certificates', { count: certificates.length });

        return NextResponse.json({
            success: true,
            certificates: certificates.map(cert => ({
                id: cert._id,
                certificateNumber: cert.certificateNumber,
                participantName: cert.participantName,
                certificateUrl: cert.certificateUrl,
                event: cert.eventId,
                verificationHash: cert.verificationHash,
                issuedAt: cert.issuedAt,
            })),
        });
    } catch (error: any) {
        logger.apiError('GET', '/api/admin/certificates', error);

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
