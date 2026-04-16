import nodemailer from 'nodemailer';
import { logger } from './logger';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const GMAIL_FROM_NAME = process.env.GMAIL_FROM_NAME || 'E-Cell RGPV';

// Configure standard nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
});

export interface EmailVariables {
    participantName: string;
    eventName: string;
    eventDate: string;
    certificateNumber: string;
    certificateLink: string;
    verificationLink: string;
    issueDate: string;
    organizer: string;
}

/**
 * Replace all {{placeholders}} in a template string with actual values
 * @param template HTML string with placeholders
 * @param variables Object containing the values for placeholders
 * @returns Parsed string
 */
export function renderEmailTemplate(template: string, variables: EmailVariables): string {
    if (!template) return '';
    
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
        // Replace all occurrences of {{key}} globally
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value);
    }
    return rendered;
}

/**
 * Send an email using Gmail SMTP
 * @param to Recipient email address
 * @param subject Email subject
 * @param htmlBody Rendered HTML email body
 */
export async function sendCertificateEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        logger.error('EMAIL', 'Gmail credentials are not configured in environment variables');
        throw new Error('Email service is not configured');
    }

    try {
        const info = await transporter.sendMail({
            from: `"${GMAIL_FROM_NAME}" <${GMAIL_USER}>`,
            to,
            subject,
            html: htmlBody,
        });

        logger.info('EMAIL', `Email sent successfully to ${to}`, { messageId: info.messageId });
        return true;
    } catch (error: any) {
        logger.error('EMAIL', `Failed to send email to ${to}`, error);
        throw error;
    }
}
