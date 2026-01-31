/**
 * Certificate Template Options
 * Available certificate templates for events
 */

export interface TemplateOption {
    value: string;
    label: string;
    description: string;
}

/**
 * Available certificate templates
 * Add new templates here when creating new template files
 */
export const TEMPLATE_OPTIONS: TemplateOption[] = [
    {
        value: 'certificate-default.html',
        label: 'Default',
        description: 'General participation certificate (Purple)',
    },
    {
        value: 'certificate-bootcamp.html',
        label: 'Bootcamp',
        description: 'Completion certificate for bootcamps (Blue)',
    },
    {
        value: 'certificate-workshop.html',
        label: 'Workshop',
        description: 'Participation certificate for workshops (Green)',
    },
    {
        value: 'certificate-hackathon.html',
        label: 'Hackathon',
        description: 'Achievement certificate for hackathons (Orange)',
    },
];
