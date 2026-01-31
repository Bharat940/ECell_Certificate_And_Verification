import mongoose, { Schema, model, models } from 'mongoose';

export interface IEvent {
    _id: mongoose.Types.ObjectId;
    title: string;
    startDate: Date;
    endDate: Date;
    organizer: string;
    template: string;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Event start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'Event end date is required'],
        },
        organizer: {
            type: String,
            required: [true, 'Organizer name is required'],
            trim: true,
        },
        template: {
            type: String,
            required: [true, 'Certificate template is required'],
            default: 'certificate-default.html',
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation in development
const Event = models.Event || model<IEvent>('Event', EventSchema);

export default Event;
