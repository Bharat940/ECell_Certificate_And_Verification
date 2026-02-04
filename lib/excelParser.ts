/**
 * Excel parser using SheetJS (xlsx)
 * Safe for Next.js App Router + Vercel serverless
 */

import * as XLSX from "xlsx";

/**
 * Parse Excel file (XLSX/XLS) to string[][]
 * First row = headers, subsequent rows = data
 */
export function parseExcel(buffer: Buffer): string[][] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error("Excel file has no sheets");
    }
    
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const json = XLSX.utils.sheet_to_json(sheet, {
        header: 1,        // Return array of arrays
        raw: false,       // Convert everything to strings
        defval: '',       // Default value for empty cells
    }) as unknown[][];
    
    // Ensure all cells are strings
    return json.map(row => 
        (Array.isArray(row) ? row : []).map(cell => 
            (cell ?? "").toString().trim()
        )
    );
}

/**
 * Validate that buffer is a valid Excel file
 */
export function isValidExcel(buffer: Buffer): boolean {
    try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        return workbook.SheetNames.length > 0;
    } catch {
        return false;
    }
}
