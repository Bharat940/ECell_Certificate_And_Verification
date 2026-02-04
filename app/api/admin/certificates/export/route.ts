/**
 * POST /api/admin/certificates/export
 * Export selected or all certificates for an event as CSV or XLSX.
 * Uses SheetJS (xlsx); returns downloadable file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export async function POST(request: NextRequest) {
    logger.apiRequest('POST', '/api/admin/certificates/export');
    try {
        await requireAdmin(request);

        const body = await request.json().catch(() => ({}));
        const { certificateIds, eventId, format } = body as {
            certificateIds?: string[];
            eventId?: string;
            format?: 'csv' | 'xlsx';
        };

        const exportFormat = format === 'csv' ? 'csv' : 'xlsx';

        await connectDB();

        let certificates: Awaited<ReturnType<typeof Certificate.find>>;
        if (Array.isArray(certificateIds) && certificateIds.length > 0) {
            certificates = await Certificate.find({ _id: { $in: certificateIds } })
                .populate<{ eventId: { title: string } }>('eventId')
                .sort({ issuedAt: -1 });
        } else if (eventId) {
            certificates = await Certificate.find({ eventId })
                .populate<{ eventId: { title: string } }>('eventId')
                .sort({ issuedAt: -1 });
        } else {
            return NextResponse.json(
                { error: 'Provide certificateIds (array) or eventId.' },
                { status: 400 }
            );
        }

        const data = certificates.map((cert) => ({
            'Participant Name': cert.participantName,
            'Certificate Number': cert.certificateNumber,
            'Event Name': (cert.eventId as { title: string })?.title ?? '',
            'Issued Date': cert.issuedAt ? new Date(cert.issuedAt).toISOString().slice(0, 10) : '',
            'Verification URL': `${BASE_URL}/verify/${cert.certificateNumber}`,
            'Certificate URL': cert.certificateUrl,
        }));

        if (exportFormat === 'csv') {
            const XLSX = await import('xlsx');
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(worksheet, { forceQuotes: true });
            const filename = `certificates-export-${Date.now()}.csv`;
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Type': 'text/csv; charset=utf-8',
                },
            });
        }

        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
        const filename = `certificates-export-${Date.now()}.xlsx`;

        logger.apiSuccess('POST', '/api/admin/certificates/export', { count: data.length, format: exportFormat });

        // NextResponse expects BodyInit; Uint8Array is valid (Buffer is not in the type def)
        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (error: unknown) {
        logger.apiError('POST', '/api/admin/certificates/export', error as Error);
        if (error instanceof Error && error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
