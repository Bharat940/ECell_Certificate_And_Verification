import crypto from "crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  deleteCertificatePDF,
  isCloudinaryConfigured,
  uploadCertificatePDF,
} from "@/lib/cloudinary";
import { isValidCertificateNumber } from "@/lib/certificateUtils";
import connectDB from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  errorMessage,
  isUnauthorizedError,
  readOptionalString,
  readRequiredString,
  validatePdfFile,
  validatePdfSignature,
} from "@/lib/requestValidation";
import Certificate from "@/models/Certificate";
import Event from "@/models/Event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  logger.apiRequest("POST", "/api/admin/certificates/upload");
  let uploadedPublicId: string | null = null;

  try {
    await requireAdmin(request);
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloud storage is not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Certificate PDF is required" },
        { status: 400 },
      );
    }

    const certificateNumber = readRequiredString(
      formData.get("certificateNumber"),
      "Certificate number",
      32,
    ).toUpperCase();
    const eventId = readRequiredString(formData.get("eventId"), "Event ID", 64);
    const participantName = readRequiredString(
      formData.get("participantName"),
      "Participant name",
      160,
    );
    const participantEmail = readOptionalString(
      formData.get("participantEmail"),
      "Participant email",
      320,
    )?.toLowerCase();

    if (!isValidCertificateNumber(certificateNumber)) {
      return NextResponse.json(
        { error: "Certificate number must match ECELL-YYYY-XXXXX" },
        { status: 400 },
      );
    }
    if (!mongoose.isValidObjectId(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    validatePdfFile(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    validatePdfSignature(buffer);

    await connectDB();
    const [event, existing] = await Promise.all([
      Event.findById(eventId),
      Certificate.exists({ certificateNumber }),
    ]);
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (existing) {
      return NextResponse.json(
        { error: `Certificate number ${certificateNumber} is already in use` },
        { status: 409 },
      );
    }

    const uploadResult = await uploadCertificatePDF(buffer, certificateNumber);
    uploadedPublicId = uploadResult.publicId;

    const verificationHash = crypto
      .createHash("sha256")
      .update(certificateNumber + event._id.toString())
      .digest("hex");

    const certificate = await Certificate.create({
      certificateNumber,
      participantName,
      participantEmail,
      eventId: event._id,
      certificateUrl: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId,
      verificationHash,
      issuedAt: new Date(),
    });
    uploadedPublicId = null;

    logger.apiSuccess("POST", "/api/admin/certificates/upload", {
      certificateNumber,
      eventId,
    });
    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        participantName: certificate.participantName,
        certificateUrl: certificate.certificateUrl,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error: unknown) {
    logger.apiError("POST", "/api/admin/certificates/upload", error);
    if (uploadedPublicId) {
      try {
        await deleteCertificatePDF(uploadedPublicId);
      } catch (cleanupError: unknown) {
        logger.error(
          "PDF_UPLOAD",
          "Failed to clean up uploaded certificate",
          cleanupError,
        );
      }
    }
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = errorMessage(error);
    if (
      message.includes("required") ||
      message.includes("must") ||
      message.includes("empty") ||
      message.includes("limit") ||
      message.includes("valid PDF")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Certificate number is already in use" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to register certificate" },
      { status: 500 },
    );
  }
}
