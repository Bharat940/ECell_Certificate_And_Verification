const MAX_TEMPLATE_HTML_BYTES = 500_000;
export const MAX_TEMPLATE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_CERTIFICATE_PDF_BYTES = 15 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} is too long`);
  }
  return normalized;
}

export function readOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string")
    throw new Error(`${fieldName} must be a string`);

  const normalized = value.trim();
  if (normalized.length > maxLength)
    throw new Error(`${fieldName} is too long`);
  return normalized || undefined;
}

export function validateTemplateHtml(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Template HTML is required");
  }
  if (Buffer.byteLength(value, "utf8") > MAX_TEMPLATE_HTML_BYTES) {
    throw new Error("Template HTML exceeds the 500 KB limit");
  }
  return value;
}

export function validateOptionalHttpUrl(value: unknown): string | undefined {
  const normalized = readOptionalString(value, "Background URL", 2_048);
  if (!normalized) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("Background URL must be a valid URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Background URL must use HTTP or HTTPS");
  }
  return normalized;
}

export function validatePdfFile(file: File): void {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Certificate file must use the .pdf extension");
  }
  if (file.type && file.type !== "application/pdf") {
    throw new Error("Certificate file must be a PDF");
  }
  if (file.size === 0) throw new Error("Certificate PDF is empty");
  if (file.size > MAX_CERTIFICATE_PDF_BYTES) {
    throw new Error("Certificate PDF exceeds the 15 MB limit");
  }
}

export function validatePdfSignature(buffer: Buffer): void {
  if (
    buffer.length < 5 ||
    buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error("Certificate file does not contain valid PDF data");
  }
}

export function validateImageFile(file: File): void {
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Template image must be a JPEG, PNG, or WebP file");
  }
  if (file.size === 0) throw new Error("Template image is empty");
  if (file.size > MAX_TEMPLATE_IMAGE_BYTES) {
    throw new Error("Template image exceeds the 10 MB limit");
  }
}

export function validateImageSignature(buffer: Buffer, mimeType: string): void {
  const isPng =
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  const valid =
    (mimeType === "image/png" && isPng) ||
    (mimeType === "image/jpeg" && isJpeg) ||
    (mimeType === "image/webp" && isWebp);
  if (!valid)
    throw new Error("Template image content does not match its file type");
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message === "Unauthorized: Invalid or missing token"
  );
}
