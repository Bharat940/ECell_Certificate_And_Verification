import mongoose, { Schema, model, models } from "mongoose";

export interface ITemplate {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  html: string;
  category?: string;
  backgroundUrl?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Template description is required"],
      trim: true,
    },
    html: {
      type: String,
      required: [true, "Template HTML content is required"],
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    backgroundUrl: {
      type: String,
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent model recompilation in development
const Template =
  models.Template || model<ITemplate>("Template", TemplateSchema);

export default Template;
