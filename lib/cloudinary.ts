/**
 * Cloudinary Upload Utility
 * Handles uploading and deleting certificate PDFs from Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}

/**
 * Upload a certificate PDF to Cloudinary
 * @param pdfBuffer - PDF file as Buffer
 * @param certificateNumber - Unique certificate identifier
 * @returns Object containing URL and public_id
 */
export async function uploadCertificatePDF(
    pdfBuffer: Buffer,
    certificateNumber: string
): Promise<CloudinaryUploadResult> {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'certificates',
                    public_id: `${certificateNumber}.pdf`, // Add .pdf extension
                    resource_type: 'raw', // For non-image files like PDFs
                    type: 'upload',
                    overwrite: false, // Prevent accidental overwrites
                    access_control: [
                        {
                            access_type: 'anonymous', // Allow public anonymous access
                        }
                    ],
                },
                (error, result) => {
                    if (error) {
                        logger.error('CLOUDINARY', 'Upload failed', error);
                        reject(new Error('Failed to upload certificate to cloud storage'));
                    } else if (result) {
                        logger.success('CLOUDINARY', 'Upload successful', {
                            publicId: result.public_id,
                        });
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    } else {
                        reject(new Error('Upload failed with no result'));
                    }
                }
            );

            // Write buffer to upload stream
            uploadStream.end(pdfBuffer);
        });
    } catch (error) {
        logger.error('CLOUDINARY', 'Certificate upload error', error);
        throw new Error('Failed to upload certificate');
    }
}

/**
 * Delete a certificate PDF from Cloudinary using public_id
 * @param publicId - Cloudinary public ID (e.g., "certificates/ECELL-2026-ABC123.pdf")
 * @returns Deletion result
 */
export async function deleteCertificatePDF(publicId: string): Promise<void> {
    try {
        logger.info('CLOUDINARY', `Deleting certificate: ${publicId}`);

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw',
        });

        if (result.result === 'ok') {
            logger.success('CLOUDINARY', `Certificate deleted: ${publicId}`);
        } else if (result.result === 'not found') {
            logger.warn('CLOUDINARY', `Certificate not found: ${publicId}`);
        } else {
            logger.warn('CLOUDINARY', `Unexpected deletion result: ${result.result}`);
        }
    } catch (error: any) {
        logger.error('CLOUDINARY', 'Certificate deletion error', {
            publicId,
            error: error.message,
        });
        throw new Error(`Failed to delete certificate from Cloudinary: ${error.message}`);
    }
}

/**
 * Check if Cloudinary is properly configured
 * @returns true if configured, false otherwise
 */
export function isCloudinaryConfigured(): boolean {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}
