/**
 * Date Formatting Utilities
 * Handles date range formatting for certificates
 */

/**
 * Format a date range for certificate display
 * @param startDate - Event start date
 * @param endDate - Event end date
 * @returns Formatted date string
 * 
 * Examples:
 * - Same day: "April 10, 2026"
 * - Multi-day same month: "April 10-12, 2026"
 * - Multi-day different months: "April 30 - May 2, 2026"
 * - Multi-day different years: "December 30, 2025 - January 2, 2026"
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
    // Safely parse dates - handle both Date objects and strings
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid Date';
    }

    // Format options
    const monthDay = { month: 'long', day: 'numeric' } as const;
    const fullDate = { year: 'numeric', month: 'long', day: 'numeric' } as const;

    // Same day
    if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString('en-US', fullDate);
    }

    // Same month and year
    if (
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear()
    ) {
        const month = start.toLocaleDateString('en-US', { month: 'long' });
        const year = start.getFullYear();
        return `${month} ${start.getDate()}-${end.getDate()}, ${year}`;
    }

    // Same year, different months
    if (start.getFullYear() === end.getFullYear()) {
        const startStr = start.toLocaleDateString('en-US', monthDay);
        const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
        const year = start.getFullYear();
        return `${startStr} - ${endMonth} ${end.getDate()}, ${year}`;
    }

    // Different years
    const startStr = start.toLocaleDateString('en-US', fullDate);
    const endStr = end.toLocaleDateString('en-US', fullDate);
    return `${startStr} - ${endStr}`;
}

/**
 * Format a single date for certificate display
 * @param date - Date to format
 * @returns Formatted date string (e.g., "April 10, 2026")
 */
export function formatSingleDate(date: Date | string): string {
    const d = new Date(date);

    // Validate date
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Check if an event is a single-day event
 * @param startDate - Event start date
 * @param endDate - Event end date
 * @returns true if same day, false otherwise
 */
export function isSingleDayEvent(startDate: Date, endDate: Date): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start.toDateString() === end.toDateString();
}

/**
 * Get event duration in days
 * @param startDate - Event start date
 * @param endDate - Event end date
 * @returns Number of days
 */
export function getEventDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
}
