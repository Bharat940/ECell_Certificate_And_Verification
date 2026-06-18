import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Template from "@/models/Template";
import { logger } from "@/lib/logger";
import {
  errorMessage,
  isRecord,
  isUnauthorizedError,
  readOptionalString,
  readRequiredString,
  validateOptionalHttpUrl,
  validateTemplateHtml,
} from "@/lib/requestValidation";

export async function GET(request: NextRequest) {
  logger.apiRequest("GET", "/api/admin/templates");
  try {
    await requireAdmin(request);
    await connectDB();

    // Get all templates (frontend will filter by isArchived)
    const templates = await Template.find({}).sort({ createdAt: -1 });

    logger.apiSuccess("GET", "/api/admin/templates", {
      count: templates.length,
    });
    return NextResponse.json({ success: true, templates });
  } catch (error: unknown) {
    logger.apiError("GET", "/api/admin/templates", error);
    const unauthorized = isUnauthorizedError(error);
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : "Failed to fetch templates" },
      { status: unauthorized ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  logger.apiRequest("POST", "/api/admin/templates");
  try {
    await requireAdmin(request);
    await connectDB();

    const body: unknown = await request.json();
    if (!isRecord(body))
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );

    const name = readRequiredString(body.name, "Name", 120);
    const description = readRequiredString(
      body.description,
      "Description",
      500,
    );
    const html = validateTemplateHtml(body.html);
    const category =
      readOptionalString(body.category, "Category", 80) || "General";
    const backgroundUrl = validateOptionalHttpUrl(body.backgroundUrl);

    const template = await Template.create({
      name,
      description,
      html,
      category,
      backgroundUrl,
    });

    logger.apiSuccess("POST", "/api/admin/templates", {
      templateId: template._id,
    });
    return NextResponse.json({ success: true, template });
  } catch (error: unknown) {
    logger.apiError("POST", "/api/admin/templates", error);
    const unauthorized = isUnauthorizedError(error);
    const message = errorMessage(error);
    return NextResponse.json(
      {
        error: unauthorized
          ? "Unauthorized"
          : message === "Unknown error"
            ? "Failed to create template"
            : message,
      },
      { status: unauthorized ? 401 : message === "Unknown error" ? 500 : 400 },
    );
  }
}
