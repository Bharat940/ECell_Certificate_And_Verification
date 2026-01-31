/**
 * QR Code Generation Utility
 * Generates QR codes for certificate verification URLs
 */

import QRCode from 'qrcode';

/**
 * Generate a QR code as a base64 data URL
 * @param certificateNumber - Unique certificate identifier
 * @returns Base64 encoded QR code image
 */
export async function generateQRCode(certificateNumber: string): Promise<string> {
    try {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateNumber}`;

        // Generate QR code as data URL (base64)
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            errorCorrectionLevel: 'H', // High error correction
            type: 'image/png',
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return qrCodeDataUrl;
    } catch (error) {
        console.error('QR code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate QR code as a buffer (for embedding in PDFs)
 * @param certificateNumber - Unique certificate identifier
 * @returns Buffer containing PNG image
 */
export async function generateQRCodeBuffer(certificateNumber: string): Promise<Buffer> {
    try {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateNumber}`;

        const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 200,
            margin: 1,
        });

        return qrCodeBuffer;
    } catch (error) {
        console.error('QR code buffer generation error:', error);
        throw new Error('Failed to generate QR code buffer');
    }
}
