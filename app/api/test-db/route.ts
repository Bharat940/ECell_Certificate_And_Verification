import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({ success: true, message: 'MongoDB connected' });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}