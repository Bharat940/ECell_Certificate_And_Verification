/**
 * POST /api/admin/certificates/import
 * Accept Excel or CSV via FormData, parse server-side, validate, return preview.
 * Does NOT generate certificates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import { validateImportRows } from '@/lib/importValidation';
import { parseCSVBuffer } from '@/lib/csvParse';
import { parseExcel, isValidExcel } from '@/lib/excelParser';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    logger.apiRequest('POST', '/api/admin/certificates/import');

    try {
        await requireAdmin(request);

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: 'Missing or invalid file. Send a file in FormData under key "file".' },
                { status: 400 }
            );
        }

        const name = file.name.toLowerCase();
        const isCsv = name.endsWith('.csv');
        const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

        if (!isCsv && !isExcel) {
            return NextResponse.json(
                { error: 'Unsupported format. Use .csv, .xlsx, or .xls.' },
                { status: 400 }
            );
        }

        // Convert to Buffer (fixes ArrayBuffer type error)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let rows: string[][];

        if (isCsv) {
            rows = parseCSVBuffer(buffer);
        } else {
            // Validate Excel file
            if (!isValidExcel(buffer)) {
                return NextResponse.json(
                    { error: 'Invalid or corrupted Excel file' },
                    { status: 400 }
                );
            }
            rows = parseExcel(buffer);
        }

        if (!rows.length || rows.length < 2) {
            return NextResponse.json({
                success: true,
                rows: [],
                total: 0,
                valid: 0,
                invalid: 0,
            });
        }

        logger.info('IMPORT', `Parsed ${rows.length - 1} rows from ${name}`);

        await connectDB();

        const existing = await Certificate.find().select('certificateNumber').lean();
        const existingCertNumbers = new Set(
            existing.map((c: any) => c.certificateNumber.toUpperCase())
        );

        const validated = validateImportRows(rows, existingCertNumbers);
        const valid = validated.filter((r) => r.isValid).length;
        const invalid = validated.filter((r) => !r.isValid).length;

        logger.apiSuccess('POST', '/api/admin/certificates/import', {
            total: validated.length,
            valid,
            invalid,
        });

        return NextResponse.json({
            success: true,
            rows: validated.map((r) => ({
                index: r.index,
                data: r.data,
                isValid: r.isValid,
                errors: r.errors,
            })),
            total: validated.length,
            valid,
            invalid,
        });

    } catch (error: unknown) {
        logger.apiError('POST', '/api/admin/certificates/import', error as Error);

        if (error instanceof Error && error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            {
                error: 'Import failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
