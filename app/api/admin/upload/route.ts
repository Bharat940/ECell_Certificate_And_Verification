import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";
import {
  errorMessage,
  isUnauthorizedError,
  validateImageFile,
  validateImageSignature,
} from "@/lib/requestValidation";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    validateImageFile(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    validateImageSignature(buffer, file.type);
    const result = await uploadImage(buffer, "templates");

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: unknown) {
    logger.error("UPLOAD", "API Error", error);
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = errorMessage(error);
    const isValidationError =
      message.includes("must") ||
      message.includes("empty") ||
      message.includes("limit") ||
      message.includes("match");
    return NextResponse.json(
      {
        error: isValidationError ? message : "Failed to upload template image",
      },
      { status: isValidationError ? 400 : 500 },
    );
  }
}
