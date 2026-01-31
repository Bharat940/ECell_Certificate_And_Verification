/**
 * PDF Generation Utility
 * Serverless-safe Puppeteer implementation
 * Works on Vercel / AWS Lambda
 */

import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs/promises";
import { logger } from "./logger";
import { getTemplatePath } from "./templateUtils";

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
 * Generate Certificate PDF
 * Following @sparticuz/chromium official usage pattern
 */
export async function generateCertificatePDF(
    data: CertificateData
): Promise<Buffer> {
    let browser: Browser | null = null;

    try {
        logger.info("PDF", "Starting PDF generation", {
            certificateNumber: data.certificateNumber,
            environment: process.env.NODE_ENV,
        });

        // Load HTML template
        const templatePath = getTemplatePath(data.templateName);
        let html = await fs.readFile(templatePath, "utf-8");

        // Inject dynamic values
        html = html
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

        logger.info("PDF", "Launching Chromium...");

        // CRITICAL: Disable WebGL for serverless (no GPU available)
        chromium.setGraphicsMode = false;

        // Get executable path - this will extract binaries to /tmp
        const executablePath = await chromium.executablePath();

        logger.info("PDF", "Chromium executable path", { executablePath });

        // Launch browser with optimized settings for serverless
        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--single-process',
                '--no-zygote',
            ],
            defaultViewport: {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            },
            executablePath: executablePath,
            headless: "shell",
        });

        logger.info("PDF", "Browser launched, creating page...");
        const page = await browser.newPage();

        logger.info("PDF", "Setting page content...");
        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 30000,
        });

        logger.info("PDF", "Generating PDF...");
        const pdf = await page.pdf({
            format: "A4",
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

        logger.success("PDF", "PDF generated successfully", {
            certificateNumber: data.certificateNumber,
            sizeKB: (pdf.length / 1024).toFixed(2),
        });

        return Buffer.from(pdf);
    } catch (error: any) {
        logger.error("PDF", "PDF generation failed", {
            error: error.message,
            stack: error.stack,
            certificateNumber: data.certificateNumber,
            environment: process.env.NODE_ENV,
        });

        // Provide specific error messages
        if (error.message?.includes("timeout")) {
            throw new Error("PDF generation timed out. Please try again.");
        } else if (
            error.message?.includes("Could not find Chrome") ||
            error.message?.includes("browser") ||
            error.message?.includes("does not exist")
        ) {
            throw new Error(
                "Failed to launch browser for PDF generation. Binary files may not be properly deployed."
            );
        } else {
            throw new Error(`Failed to generate certificate PDF: ${error.message}`);
        }
    } finally {
        if (browser) {
            try {
                // Close all pages first to prevent hanging
                const pages = await browser.pages();
                await Promise.all(pages.map(page => page.close()));
                await browser.close();
                logger.info("PDF", "Browser closed successfully");
            } catch (closeError) {
                logger.error("PDF", "Error closing browser", closeError);
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
        const templatePath = getTemplatePath("certificate-default.html");
        await fs.access(templatePath);
        return true;
    } catch {
        return false;
    }
}
