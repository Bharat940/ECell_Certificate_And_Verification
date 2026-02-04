import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import { requireAdmin } from '@/lib/auth';
import { deleteCertificatePDF } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';

export const maxDuration = 60; // Allow sufficient time for Cloudinary deletes
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
    try {
        // Verify admin authentication
        await requireAdmin(request);

        logger.apiRequest('DELETE', '/api/admin/certificates/bulk-delete');

        // Parse request body
        const body = await request.json();
        const { certificateIds } = body;

        // Validate input
        if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request. certificateIds array is required.' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Track results
        let successCount = 0;
        let failureCount = 0;
        const errors: Array<{ certificateId: string; error: string }> = [];

        // Process each certificate
        for (const certId of certificateIds) {
            try {
                // Fetch certificate to get cloudinaryPublicId
                const certificate = await Certificate.findById(certId);

                if (!certificate) {
                    failureCount++;
                    errors.push({
                        certificateId: certId,
                        error: 'Certificate not found'
                    });
                    continue;
                }

                // Delete from Cloudinary
                if (certificate.cloudinaryPublicId) {
                    try {
                        await deleteCertificatePDF(certificate.cloudinaryPublicId);
                        logger.info('CLOUDINARY', `Deleted certificate from Cloudinary: ${certificate.cloudinaryPublicId}`);
                    } catch (cloudinaryError) {
                        const errorMsg = cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error';
                        logger.error('CLOUDINARY', 'Cloudinary deletion failed', errorMsg);
                        // Continue with DB deletion even if Cloudinary fails
                    }
                }

                // Delete from MongoDB
                await Certificate.findByIdAndDelete(certId);
                successCount++;
                logger.info('CERTIFICATE', `Deleted certificate: ${certificate.certificateNumber}`);

            } catch (error) {
                failureCount++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push({
                    certificateId: certId,
                    error: errorMessage
                });
                logger.error('CERTIFICATE', `Failed to delete certificate ${certId}`, errorMessage);
            }
        }

        logger.apiSuccess('DELETE', '/api/admin/certificates/bulk-delete', {
            requested: certificateIds.length,
            deleted: successCount,
            failed: failureCount
        });

        return NextResponse.json({
            success: true,
            deleted: successCount,
            failed: failureCount,
            total: certificateIds.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        logger.apiError('DELETE', '/api/admin/certificates/bulk-delete', error);
        return NextResponse.json(
            { error: 'Failed to delete certificates' },
            { status: 500 }
        );
    }
}
