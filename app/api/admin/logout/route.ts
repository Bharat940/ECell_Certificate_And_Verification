import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST() {
    logger.authLogout('admin');
    try {
        // Create response
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        });

        // Clear the authentication cookie
        response.cookies.delete('authToken');

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}
