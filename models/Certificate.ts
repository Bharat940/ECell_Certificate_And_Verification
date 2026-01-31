import mongoose, { Schema, model, models } from 'mongoose';
import { IEvent } from './Event';

export interface ICertificate {
    _id: mongoose.Types.ObjectId;
    certificateNumber: string;
    participantName: string;
    participantEmail?: string;
    eventId: mongoose.Types.ObjectId | IEvent;
    certificateUrl: string;
    cloudinaryPublicId: string;
    verificationHash: string;
    issuedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
    {
        certificateNumber: {
            type: String,
            required: [true, 'Certificate number is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        participantName: {
            type: String,
            required: [true, 'Participant name is required'],
            trim: true,
        },
        participantEmail: {
            type: String,
            required: false,
            trim: true,
            lowercase: true,
        },
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event ID is required'],
        },
        certificateUrl: {
            type: String,
            required: [true, 'Certificate URL is required'],
            trim: true,
        },
        cloudinaryPublicId: {
            type: String,
            required: [true, 'Cloudinary public ID is required'],
            trim: true,
        },
        verificationHash: {
            type: String,
            required: [true, 'Verification hash is required'],
            trim: true,
        },
        issuedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);



// Prevent model recompilation in development
const Certificate = models.Certificate || model<ICertificate>('Certificate', CertificateSchema);

export default Certificate;
