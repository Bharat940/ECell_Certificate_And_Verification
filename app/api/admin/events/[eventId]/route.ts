import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import Event, { IEvent } from "@/models/Event";
import Template from "@/models/Template";
import Certificate from "@/models/Certificate";
import { logger } from "@/lib/logger";
import { validateTemplate, isValidTemplateFilename } from "@/lib/templateUtils";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

/**
 * GET /api/admin/events/[eventId]
 * Get a single event by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  logger.apiRequest("GET", "/api/admin/events/[eventId]");
  try {
    await requireAdmin(request);

    const { eventId } = await params;
    if (!mongoose.isValidObjectId(eventId))
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });

    await connectDB();

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    logger.apiSuccess("GET", "/api/admin/events/[eventId]", { eventId });
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
        templateHtml: event.templateHtml,
        templateBackgroundUrl: event.templateBackgroundUrl,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (error: unknown) {
    logger.apiError("GET", "/api/admin/events/[eventId]", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized: Invalid or missing token"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/events/[eventId]
 * Update an event
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  logger.apiRequest("PUT", "/api/admin/events/[eventId]");
  try {
    await requireAdmin(request);

    const { eventId } = await params;
    if (!mongoose.isValidObjectId(eventId))
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    const body = await request.json();
    const { title, startDate, endDate, organizer, template, templateId } = body;

    // Validate required fields
    if (!title || !startDate || !organizer) {
      return NextResponse.json(
        { error: "Title, start date, and organizer are required" },
        { status: 400 },
      );
    }

    // Set endDate to startDate if not provided
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

    await connectDB();

    const currentEvent = await Event.findById(eventId);
    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let templateHtml = currentEvent.templateHtml || "";
    let templateBackgroundUrl = currentEvent.templateBackgroundUrl || "";
    let templateName = currentEvent.template;
    let finalTemplateId = currentEvent.templateId;

    if (templateId) {
      if (!mongoose.isValidObjectId(templateId)) {
        return NextResponse.json(
          { error: "Invalid template blueprint ID" },
          { status: 400 },
        );
      }
      const isSameBlueprint =
        currentEvent.templateId?.toString() === templateId;
      if (!isSameBlueprint) {
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
      }
      templateName = "";
      finalTemplateId = templateId;
    } else if (template) {
      // Legacy File-based approach
      if (!isValidTemplateFilename(template)) {
        return NextResponse.json(
          { error: "Invalid template selected" },
          { status: 400 },
        );
      }
      const templateExists = await validateTemplate(template);
      if (!templateExists) {
        return NextResponse.json(
          { error: "Template file not found" },
          { status: 400 },
        );
      }
      if (currentEvent.templateId || currentEvent.template !== template) {
        templateHtml = "";
        templateBackgroundUrl = "";
      }
      templateName = template;
      finalTemplateId = undefined;
    }

    const templateUpdate: mongoose.UpdateQuery<IEvent> = finalTemplateId
      ? {
          $set: {
            template: templateName,
            templateId: finalTemplateId,
            templateHtml,
            templateBackgroundUrl,
          },
        }
      : {
          $set: { template: templateName },
          $unset: { templateId: 1, templateHtml: 1, templateBackgroundUrl: 1 },
        };

    // Explicitly unset snapshot fields when switching back to a legacy template.
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        ...templateUpdate,
        $set: {
          ...templateUpdate.$set,
          title,
          startDate: new Date(startDate),
          endDate: new Date(eventEndDate),
          organizer,
        },
      },
      { new: true, runValidators: true },
    );

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    logger.apiSuccess("PUT", "/api/admin/events/[eventId]", {
      eventId,
      title: event.title,
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
        updatedAt: event.updatedAt,
      },
    });
  } catch (error: unknown) {
    logger.apiError("PUT", "/api/admin/events/[eventId]", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized: Invalid or missing token"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/events/[eventId]
 * Delete an event (only if no certificates exist)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  logger.apiRequest("DELETE", "/api/admin/events/[eventId]");
  try {
    await requireAdmin(request);

    const { eventId } = await params;

    await connectDB();

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event has any certificates
    const certificateCount = await Certificate.countDocuments({ eventId });
    if (certificateCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete event with existing certificates",
          certificateCount,
        },
        { status: 400 },
      );
    }

    // Delete event
    await Event.findByIdAndDelete(eventId);

    logger.apiSuccess("DELETE", "/api/admin/events/[eventId]", {
      eventId,
      title: event.title,
    });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error: unknown) {
    logger.apiError("DELETE", "/api/admin/events/[eventId]", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized: Invalid or missing token"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
