/**
 * PDF Generation Utility
 * - Local dev:  puppeteer-core → system Chrome/Chromium (must be installed)
 * - Production: puppeteer-core → @sparticuz/chromium-min (Vercel serverless)
 *
 * Install:
 *   npm install puppeteer-core @sparticuz/chromium-min --save
 */

import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "fs/promises";
import { logger } from "./logger";
import { getTemplatePath } from "./templateUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Hosted chromium pack for Vercel.
 * Consider re-hosting on Vercel Blob or a private CDN for production.
 */
const CHROMIUM_PACK_URL =
    "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

/**
 * Known system Chrome/Chromium paths per platform.
 * Returns the first one that actually exists on disk, or null.
 */
const SYSTEM_CHROME_PATHS: Record<string, string[]> = {
    win32: [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ],
    darwin: [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ],
    linux: [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ],
};

async function findSystemChrome(): Promise<string | null> {
    const candidates = SYSTEM_CHROME_PATHS[process.platform] ?? [];
    for (const candidate of candidates) {
        try {
            await fs.access(candidate); // throws if path does not exist
            return candidate;
        } catch {
            // not found – try next
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Browser factory
// ---------------------------------------------------------------------------

async function launchBrowser(): Promise<Browser> {
    // ── Production (Vercel) ──────────────────────────────────────────────────
    if (!IS_DEV) {
        chromium.setGraphicsMode = false;
        const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
        logger.info("PDF", "Chromium binary extracted", { executablePath });

        return await puppeteer.launch({
            args: [
                ...chromium.args,
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--single-process",
                "--no-zygote",
            ],
            defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
            executablePath,
            headless: "shell",
        });
    }

    // ── Local dev (system Chrome) ────────────────────────────────────────────
    const executablePath = await findSystemChrome();

    if (!executablePath) {
        throw new Error(
            "No Chrome/Chromium found on this machine. " +
            "Install Google Chrome or Chromium to generate PDFs locally.\n" +
            "Checked paths: " +
            (SYSTEM_CHROME_PATHS[process.platform] ?? []).join(", ")
        );
    }

    logger.info("PDF", "Using system Chrome", { executablePath });

    return await puppeteer.launch({
        executablePath,
        headless: "shell",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    });
}

// ---------------------------------------------------------------------------
// Core: generate a certificate PDF
// ---------------------------------------------------------------------------

export async function generateCertificatePDF(
    data: CertificateData
): Promise<Buffer> {
    let browser: Browser | null = null;

    try {
        logger.info("PDF", "Starting PDF generation", {
            certificateNumber: data.certificateNumber,
            environment: process.env.NODE_ENV,
        });

        // ── 1. Load & hydrate the HTML template ──────────────────────────────
        const templatePath = getTemplatePath(data.templateName);
        let html = await fs.readFile(templatePath, "utf-8");

        html = html
            .replace(/{{participantName}}/g, data.participantName)
            .replace(/{{eventName}}/g, data.eventName)
            .replace(/{{eventStartDate}}/g, data.eventStartDate)
            .replace(/{{eventEndDate}}/g, data.eventEndDate)
            .replace(/{{eventDateRange}}/g, data.eventDateRange)
            .replace(/{{eventDate}}/g, data.eventDateRange)
            .replace(/{{certificateNumber}}/g, data.certificateNumber)
            .replace(/{{issueDate}}/g, data.issueDate)
            .replace(/{{organizerName}}/g, data.organizerName)
            .replace(/{{qrCodeDataUrl}}/g, data.qrCodeDataUrl);

        // ── 2. Launch browser ─────────────────────────────────────────────────
        logger.info("PDF", "Launching browser...");
        browser = await launchBrowser();

        // ── 3. Render HTML → PDF ─────────────────────────────────────────────
        logger.info("PDF", "Browser launched, creating page...");
        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 30000,
        });

        logger.info("PDF", "Generating PDF...");
        const pdf = await page.pdf({
            format: "A4",
            landscape: true,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
        });

        if (error.message?.includes("timeout")) {
            throw new Error("PDF generation timed out. Please try again.");
        }
        throw new Error(`Failed to generate certificate PDF: ${error.message}`);
    } finally {
        if (browser) {
            try {
                const pages = await browser.pages();
                await Promise.all(pages.map((p) => p.close().catch(() => { })));
                await browser.close();
                logger.info("PDF", "Browser closed successfully");
            } catch (closeError) {
                logger.error("PDF", "Error closing browser", closeError);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Utility: validate the default template exists on disk
// ---------------------------------------------------------------------------

export async function validateCertificateTemplate(): Promise<boolean> {
    try {
        const templatePath = getTemplatePath("certificate-default.html");
        await fs.access(templatePath);
        return true;
    } catch {
        return false;
    }
}