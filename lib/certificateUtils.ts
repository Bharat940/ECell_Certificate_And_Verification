/**
 * Generates a unique certificate number in the format:
 * ECELL-YYYY-XXXXX
 * 
 * Example: ECELL-2025-KD93Q
 * 
 * @returns {string} A unique certificate number
 */
export function generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const randomChars = generateRandomString(5);

    return `ECELL-${year}-${randomChars}`;
}

/**
 * Generates a random alphanumeric string (uppercase)
 * 
 * @param {number} length - Length of the random string
 * @returns {string} Random uppercase alphanumeric string
 */
function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }

    return result;
}

/**
 * Validates certificate number format
 * 
 * @param {string} certNumber - Certificate number to validate
 * @returns {boolean} True if valid format
 */
export function isValidCertificateNumber(certNumber: string): boolean {
    const pattern = /^ECELL-\d{4}-[A-Z0-9]{5}$/;
    return pattern.test(certNumber);
}
