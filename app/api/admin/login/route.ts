import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminKey, generateToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    logger.apiRequest('POST', '/api/admin/login');
    try {
        const body = await request.json();
        const { adminKey } = body;

        if (!adminKey) {
            return NextResponse.json(
                { error: 'Admin key is required' },
                { status: 400 }
            );
        }

        // Verify admin key
        if (!verifyAdminKey(adminKey)) {
            logger.authFailure('admin', 'Invalid admin key');
            return NextResponse.json(
                { error: 'Invalid admin key' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = generateToken('3h');

        // Create response
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
        });

        // Set HTTP-only cookie
        response.cookies.set('authToken', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 3, // 3 hours
            path: '/',
        });

        logger.authSuccess('admin');
        return response;
    } catch (error) {
        logger.apiError('POST', '/api/admin/login', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
