/**
 * Template Management Utilities
 * Handles certificate template selection and validation
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';

export interface Template {
    name: string;
    filename: string;
    description: string;
    color: string;
}

/**
 * Available certificate templates
 */
export const AVAILABLE_TEMPLATES: Template[] = [
    {
        name: 'Default',
        filename: 'certificate-default.html',
        description: 'Classic purple gradient design',
        color: '#667eea',
    },
    {
        name: 'Bootcamp',
        filename: 'certificate-bootcamp.html',
        description: 'Technical blue theme for bootcamps',
        color: '#3b82f6',
    },
    {
        name: 'Workshop',
        filename: 'certificate-workshop.html',
        description: 'Creative green theme for workshops',
        color: '#10b981',
    },
    {
        name: 'Hackathon',
        filename: 'certificate-hackathon.html',
        description: 'Dynamic orange theme for hackathons',
        color: '#f97316',
    },
];

/**
 * Get list of available templates
 */
export function getAvailableTemplates(): Template[] {
    return AVAILABLE_TEMPLATES;
}

/**
 * Validate that a template exists
 * @param templateName - Template filename (e.g., "certificate-default.html")
 * @returns true if template exists, false otherwise
 */
export async function validateTemplate(templateName: string): Promise<boolean> {
    try {
        const templatePath = getTemplatePath(templateName);
        await fs.access(templatePath);
        logger.info('TEMPLATE', `Template validated: ${templateName}`);
        return true;
    } catch {
        logger.error('TEMPLATE', `Template not found: ${templateName}`);
        return false;
    }
}

/**
 * Get absolute path to a template file
 * @param templateName - Template filename
 * @returns Absolute path to template
 */
export function getTemplatePath(templateName: string): string {
    return path.join(process.cwd(), 'public', 'templates', templateName);
}

/**
 * Get template by filename
 * @param filename - Template filename
 * @returns Template object or undefined
 */
export function getTemplateByFilename(filename: string): Template | undefined {
    return AVAILABLE_TEMPLATES.find(t => t.filename === filename);
}

/**
 * Check if template filename is valid
 * @param filename - Template filename to check
 * @returns true if filename is in available templates
 */
export function isValidTemplateFilename(filename: string): boolean {
    return AVAILABLE_TEMPLATES.some(t => t.filename === filename);
}
