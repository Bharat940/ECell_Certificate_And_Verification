/**
 * PDF Generation Utility
 * Converts HTML certificate templates to PDF using Puppeteer
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { getTemplatePath } from './templateUtils';

export interface CertificateData {
    participantName: string;
    eventName: string;
    eventStartDate: string;
    eventEndDate: string;
    eventDateRange: string;
    certificateNumber: string;
    issueDate: string;
    organizerName: string;
    qrCodeDataUrl: string;
    templateName: string;
}

/**
 * Generate a certificate PDF from HTML template
 * @param data - Certificate data to inject into template
 * @returns PDF as Buffer
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
    let browser;

    try {
        logger.info('PDF', 'Starting PDF generation', {
            certificateNumber: data.certificateNumber,
            template: data.templateName
        });

        // Read HTML template using template name
        const templatePath = getTemplatePath(data.templateName);
        let htmlContent = await fs.readFile(templatePath, 'utf-8');

        // Replace placeholders with actual data
        htmlContent = htmlContent
            .replace(/{{participantName}}/g, data.participantName)
            .replace(/{{eventName}}/g, data.eventName)
            .replace(/{{eventStartDate}}/g, data.eventStartDate)
            .replace(/{{eventEndDate}}/g, data.eventEndDate)
            .replace(/{{eventDateRange}}/g, data.eventDateRange)
            .replace(/{{eventDate}}/g, data.eventDateRange) // Backward compatibility
            .replace(/{{certificateNumber}}/g, data.certificateNumber)
            .replace(/{{issueDate}}/g, data.issueDate)
            .replace(/{{organizerName}}/g, data.organizerName)
            .replace(/{{qrCodeDataUrl}}/g, data.qrCodeDataUrl);

        // Launch headless browser with timeout
        logger.info('PDF', 'Launching Puppeteer browser...');
        browser = await puppeteer.launch({
            headless: true,
            timeout: 60000, // 60 second timeout for browser launch
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
            ],
        });

        logger.info('PDF', 'Browser launched, creating page...');
        const page = await browser.newPage();

        // Set content and wait for resources to load
        logger.info('PDF', 'Setting page content...');
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
            timeout: 30000, // 30 second timeout for content loading
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            },
            preferCSSPageSize: true,
        });

        logger.success('PDF', 'PDF generated successfully', {
            certificateNumber: data.certificateNumber,
            size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
        });

        return Buffer.from(pdfBuffer);
    } catch (error: any) {
        logger.error('PDF', 'PDF generation failed', {
            error: error.message,
            stack: error.stack,
            certificateNumber: data.certificateNumber
        });

        // Provide more specific error message
        if (error.message?.includes('timeout')) {
            throw new Error('PDF generation timed out. Please try again.');
        } else if (error.message?.includes('browser')) {
            throw new Error('Failed to launch browser for PDF generation. Please contact administrator.');
        } else {
            throw new Error(`Failed to generate certificate PDF: ${error.message}`);
        }
    } finally {
        if (browser) {
            try {
                await browser.close();
                logger.info('PDF', 'Browser closed successfully');
            } catch (closeError) {
                logger.error('PDF', 'Error closing browser', closeError);
            }
        }
    }
}

/**
 * Validate that the certificate template exists
 * @returns true if template exists, false otherwise
 */
export async function validateCertificateTemplate(): Promise<boolean> {
    try {
        const templatePath = path.join(process.cwd(), 'public', 'templates', 'certificate.html');
        await fs.access(templatePath);
        return true;
    } catch {
        return false;
    }
}
