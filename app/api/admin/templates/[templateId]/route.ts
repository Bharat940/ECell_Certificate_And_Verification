import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Template from "@/models/Template";
import { logger } from "@/lib/logger";
import mongoose from "mongoose";
import {
  errorMessage,
  isRecord,
  isUnauthorizedError,
  readOptionalString,
  readRequiredString,
  validateOptionalHttpUrl,
  validateTemplateHtml,
} from "@/lib/requestValidation";

interface RouteParams {
  params: Promise<{
    templateId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  logger.apiRequest("GET", `/api/admin/templates/${templateId}`);
  try {
    await requireAdmin(request);
    if (!mongoose.isValidObjectId(templateId))
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    await connectDB();

    const template = await Template.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error: unknown) {
    logger.apiError("GET", `/api/admin/templates/${templateId}`, error);
    if (isUnauthorizedError(error))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  logger.apiRequest("PUT", `/api/admin/templates/${templateId}`);
  try {
    await requireAdmin(request);
    if (!mongoose.isValidObjectId(templateId))
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    await connectDB();

    const body: unknown = await request.json();
    if (!isRecord(body))
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );

    const updates: Record<string, string | boolean | undefined> = {};
    if ("name" in body)
      updates.name = readRequiredString(body.name, "Name", 120);
    if ("description" in body)
      updates.description = readRequiredString(
        body.description,
        "Description",
        500,
      );
    if ("html" in body) updates.html = validateTemplateHtml(body.html);
    if ("category" in body)
      updates.category =
        readOptionalString(body.category, "Category", 80) || "General";
    if ("backgroundUrl" in body)
      updates.backgroundUrl = validateOptionalHttpUrl(body.backgroundUrl) || "";
    if ("isArchived" in body) {
      if (typeof body.isArchived !== "boolean")
        return NextResponse.json(
          { error: "isArchived must be a boolean" },
          { status: 400 },
        );
      updates.isArchived = body.isArchived;
    }
    if (Object.keys(updates).length === 0)
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );

    const template = await Template.findByIdAndUpdate(templateId, updates, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    logger.apiSuccess("PUT", `/api/admin/templates/${templateId}`);
    return NextResponse.json({ success: true, template });
  } catch (error: unknown) {
    logger.apiError("PUT", `/api/admin/templates/${templateId}`, error);
    if (isUnauthorizedError(error))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const message = errorMessage(error);
    return NextResponse.json(
      {
        error:
          message === "Unknown error" ? "Failed to update template" : message,
      },
      { status: message === "Unknown error" ? 500 : 400 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  logger.apiRequest("DELETE", `/api/admin/templates/${templateId}`);
  try {
    await requireAdmin(request);
    if (!mongoose.isValidObjectId(templateId))
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    await connectDB();

    // Soft delete: move to archived
    const template = await Template.findByIdAndUpdate(
      templateId,
      { isArchived: true },
      { new: true },
    );

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    logger.info("TEMPLATE", `Template archived: ${templateId}`);
    return NextResponse.json({
      success: true,
      message: "Template archived successfully",
    });
  } catch (error: unknown) {
    logger.apiError("DELETE", `/api/admin/templates/${templateId}`, error);
    if (isUnauthorizedError(error))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(
      { error: "Failed to archive template" },
      { status: 500 },
    );
  }
}
