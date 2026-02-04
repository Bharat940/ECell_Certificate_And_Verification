/**
 * Import validation for certificate bulk import.
 * Validates rows from Excel/CSV before preview and generation.
 */

export interface ImportRowData {
    participantName: string;
    participantEmail?: string;
    eventName: string;
    eventStartDate: string;
    eventEndDate: string;
    certificateNumber?: string;
}

export interface ValidatedImportRow {
    index: number;
    data: ImportRowData;
    isValid: boolean;
    errors: string[];
}

/** Expected column names (case-insensitive, spaces ignored). */
const COLUMNS: Record<string, string[]> = {
    participantName: ['participantname', 'participant name', 'name'],
    participantEmail: ['participantemail', 'participant email', 'email'],
    eventName: ['eventname', 'event name', 'event'],
    eventStartDate: ['eventstartdate', 'event start date', 'start date', 'startdate'],
    eventEndDate: ['eventenddate', 'event end date', 'end date', 'enddate'],
    certificateNumber: ['certificatenumber', 'certificate number'],
};

function normalizeHeader(h: string): string {
    return String(h ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

function findColumnKey(headers: string[]): Record<string, number> {
    const normalized = headers.map(normalizeHeader);
    const map: Record<string, number> = {};
    for (const [key, aliases] of Object.entries(COLUMNS)) {
        const normAliases = aliases.map((a) => a.toLowerCase().replace(/\s+/g, ''));
        for (let i = 0; i < normalized.length; i++) {
            if (normAliases.includes(normalized[i])) {
                map[key] = i;
                break;
            }
        }
    }
    return map;
}

function parseCell(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).trim();
}

/** Simple email validation (optional field). */
function isValidEmail(s: string): boolean {
    if (!s || !s.trim()) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(s.trim());
}

function parseFlexibleDate(s: string): string {
    if (!s || !s.trim()) return '';

    // Try DD-MM-YYYY format (common in India)
    const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = s.trim().match(ddmmyyyy);
    if (match) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`; // Convert to ISO
    }

    // Otherwise return as-is (already ISO or will be validated)
    return s.trim();
}

// Update isValidDateStr function
function isValidDateStr(s: string): boolean {
    if (!s || !s.trim()) return false;
    const normalized = parseFlexibleDate(s);
    const d = new Date(normalized);
    return !Number.isNaN(d.getTime());
}

/** Certificate number must be unique; format validated in certificateUtils. */
function formatCertNumber(s: string): string {
    return String(s ?? '').trim().toUpperCase();
}

/**
 * Parse a single row of string[] into ImportRowData and validate.
 */
export function validateRow(
    row: string[],
    index: number,
    columnMap: Record<string, number>,
    existingCertNumbers: Set<string>
): ValidatedImportRow {
    const get = (key: string): string => parseCell(row[columnMap[key]] ?? '');
    const errors: string[] = [];
    const participantName = get('participantName');
    const participantEmail = get('participantEmail');
    const eventName = get('eventName');
    const eventStartDate = get('eventStartDate');
    const eventEndDate = get('eventEndDate');
    const certificateNumber = get('certificateNumber');

    if (!participantName) errors.push('participantName is required');
    if (!eventName) errors.push('eventName is required');
    if (!eventStartDate) errors.push('eventStartDate is required');
    else if (!isValidDateStr(eventStartDate)) errors.push('eventStartDate must be a valid date');
    if (!eventEndDate) errors.push('eventEndDate is required');
    else if (!isValidDateStr(eventEndDate)) errors.push('eventEndDate must be a valid date');
    if (participantEmail && !isValidEmail(participantEmail)) errors.push('participantEmail must be a valid email');
    if (certificateNumber) {
        const cert = formatCertNumber(certificateNumber);
        if (existingCertNumbers.has(cert)) errors.push('certificateNumber must be unique');
    }

    const isValid = errors.length === 0;
    const data: ImportRowData = {
        participantName: participantName || '',
        eventName: eventName || '',
        eventStartDate: eventStartDate || '',
        eventEndDate: eventEndDate || '',
    };
    if (participantEmail) data.participantEmail = participantEmail;
    if (certificateNumber) data.certificateNumber = formatCertNumber(certificateNumber);

    return { index, data, isValid, errors };
}

/**
 * Build column map from first row (headers), then validate all data rows.
 */
export function validateImportRows(
    rows: string[][],
    existingCertNumbers: Set<string> = new Set()
): ValidatedImportRow[] {
    if (rows.length < 2) return [];
    const headers = rows[0];
    const columnMap = findColumnKey(headers);
    const results: ValidatedImportRow[] = [];
    const seenCerts = new Set(existingCertNumbers);

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const certNum = columnMap.certificateNumber != null ? parseCell(row[columnMap.certificateNumber] ?? '') : '';
        if (certNum) {
            const cert = formatCertNumber(certNum);
            if (seenCerts.has(cert)) {
                results.push({
                    index: i + 1,
                    data: {
                        participantName: parseCell(row[columnMap.participantName]),
                        eventName: parseCell(row[columnMap.eventName]),
                        eventStartDate: parseCell(row[columnMap.eventStartDate]),
                        eventEndDate: parseCell(row[columnMap.eventEndDate]),
                    },
                    isValid: false,
                    errors: ['certificateNumber must be unique within file'],
                });
                continue;
            }
            seenCerts.add(cert);
        }
        const validated = validateRow(row, i + 1, columnMap, seenCerts);
        results.push(validated);
    }
    return results;
}
