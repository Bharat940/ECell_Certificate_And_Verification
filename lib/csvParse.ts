/**
 * Simple server-side CSV parser (no papaparse).
 * Returns rows as string[][]; first row is headers.
 */

export function parseCSVBuffer(buffer: Buffer): string[][] {
    const text = buffer.toString('utf-8');
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (!inQuotes) {
            if (c === '\n' || c === '\r') {
                if (current.length > 0 || lines.length > 0) {
                    lines.push(current);
                    current = '';
                }
                if (c === '\r' && text[i + 1] === '\n') i++;
                continue;
            }
            if (c === ',') {
                current += '\x00'; // temporary separator
                continue;
            }
        }
        current += c;
    }
    if (current.length > 0) lines.push(current);

    return lines.map((line) => line.split('\x00').map((cell) => cell.trim().replace(/^"|"$/g, '').trim()));
}
