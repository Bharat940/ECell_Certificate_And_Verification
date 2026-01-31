import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import { logger } from '@/lib/logger';
import { deleteCertificatePDF } from '@/lib/cloudinary';

interface RouteParams {
    params: Promise<{
        certificateId: string;
    }>;
}

/**
 * DELETE /api/admin/certificates/[certificateId]
 * Delete a certificate from database and Cloudinary
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    logger.apiRequest('DELETE', '/api/admin/certificates/[certificateId]');
    try {
        await requireAdmin(request);

        const { certificateId } = await params;

        await connectDB();

        // Find certificate
        const certificate = await Certificate.findById(certificateId);
        if (!certificate) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        const certificateNumber = certificate.certificateNumber;
        const cloudinaryPublicId = certificate.cloudinaryPublicId;

        // Delete from Cloudinary first (only if publicId exists)
        if (cloudinaryPublicId) {
            try {
                await deleteCertificatePDF(cloudinaryPublicId);
                logger.success('CERT', `Deleted from Cloudinary: ${cloudinaryPublicId}`);
            } catch (cloudinaryError: any) {
                logger.warn('CERT', `Cloudinary deletion warning: ${cloudinaryError.message}`);
                // Continue with database deletion even if Cloudinary fails
            }
        } else {
            logger.warn('CERT', 'No Cloudinary public ID found for certificate, skipping Cloudinary deletion');
        }

        // Delete from database
        await Certificate.findByIdAndDelete(certificateId);

        logger.apiSuccess('DELETE', '/api/admin/certificates/[certificateId]', {
            certificateId,
            certificateNumber,
        });

        return NextResponse.json({
            success: true,
            message: 'Certificate deleted successfully',
            certificateNumber,
        });
    } catch (error: any) {
        logger.apiError('DELETE', '/api/admin/certificates/[certificateId]', error);

        if (error.message === 'Unauthorized: Invalid or missing token') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
    }
}
