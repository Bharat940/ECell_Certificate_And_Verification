import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Event from "@/models/Event";
import Template from "@/models/Template";
import { logger } from "@/lib/logger";
import { validateTemplate, isValidTemplateFilename } from "@/lib/templateUtils";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  logger.apiRequest("POST", "/api/admin/events");
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const body = await request.json();
    const { title, startDate, endDate, organizer, template, templateId } = body;

    // Validate required fields
    if (!title || !startDate || !organizer) {
      return NextResponse.json(
        { error: "Title, start date, and organizer are required" },
        { status: 400 },
      );
    }

    // Set endDate to startDate if not provided (single-day event)
    const eventEndDate = endDate || startDate;
    if (
      Number.isNaN(Date.parse(startDate)) ||
      Number.isNaN(Date.parse(eventEndDate))
    ) {
      return NextResponse.json(
        { error: "Event dates must be valid dates" },
        { status: 400 },
      );
    }
    if (new Date(eventEndDate) < new Date(startDate)) {
      return NextResponse.json(
        { error: "Event end date cannot be before its start date" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    let templateHtml = "";
    let templateBackgroundUrl = "";
    let templateName = template || "certificate-default.html";

    if (templateId) {
      if (!mongoose.isValidObjectId(templateId)) {
        return NextResponse.json(
          { error: "Invalid template blueprint ID" },
          { status: 400 },
        );
      }
      // New Blueprint-based approach
      const blueprint = await Template.findOne({
        _id: templateId,
        isArchived: false,
      });
      if (!blueprint) {
        return NextResponse.json(
          { error: "Active template blueprint not found" },
          { status: 404 },
        );
      }
      templateHtml = blueprint.html;
      templateBackgroundUrl = blueprint.backgroundUrl || "";
      templateName = ""; // Mark as not file-based
    } else {
      // Legacy File-based approach
      if (!isValidTemplateFilename(templateName)) {
        return NextResponse.json(
          { error: "Invalid template selected" },
          { status: 400 },
        );
      }
      const templateExists = await validateTemplate(templateName);
      if (!templateExists) {
        return NextResponse.json(
          { error: "Template file not found" },
          { status: 400 },
        );
      }
    }

    // Create event
    const event = await Event.create({
      title,
      startDate: new Date(startDate),
      endDate: new Date(eventEndDate),
      organizer,
      template: templateName,
      templateId: templateId || undefined,
      templateHtml: templateHtml || undefined,
      templateBackgroundUrl: templateBackgroundUrl || undefined,
    });

    logger.apiSuccess("POST", "/api/admin/events", {
      eventId: event._id,
      title: event.title,
      hasSnapshot: !!event.templateHtml,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        organizer: event.organizer,
        template: event.template,
        templateId: event.templateId,
        createdAt: event.createdAt,
      },
    });
  } catch (error: unknown) {
    logger.apiError("POST", "/api/admin/events", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized: Invalid or missing token"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  logger.apiRequest("GET", "/api/admin/events");
  try {
    // Verify admin authentication
    await requireAdmin(request);

    // Connect to database
    await connectDB();

    // Get all events
    const events = await Event.find().sort({ createdAt: -1 });

    logger.apiSuccess("GET", "/api/admin/events", { count: events.length });
    return NextResponse.json({
      success: true,
      events: events.map((event) => ({
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        organizer: event.organizer,
        template: event.template,
        templateId: event.templateId,
        createdAt: event.createdAt,
      })),
    });
  } catch (error: unknown) {
    logger.apiError("GET", "/api/admin/events", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized: Invalid or missing token"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
