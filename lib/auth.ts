import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_KEY = process.env.ADMIN_KEY;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

if (!ADMIN_KEY) {
    throw new Error('ADMIN_KEY is not defined in environment variables');
}

export interface JWTPayload {
    isAdmin: boolean;
    iat?: number;
    exp?: number;
}

/**
 * Generate a JWT token for admin authentication
 * @param expiresIn - Token expiration time (default: 3 hours)
 * @returns JWT token string
 */
export function generateToken(expiresIn: string = '3h'): string {
    const payload: JWTPayload = {
        isAdmin: true,
    };

    return jwt.sign(payload, JWT_SECRET as string, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Verify admin key
 * @param key - Admin key to verify
 * @returns true if valid, false otherwise
 */
export function verifyAdminKey(key: string): boolean {
    return key === ADMIN_KEY;
}

/**
 * Extract and verify JWT from HTTP-only cookie
 * @param request - Next.js request object
 * @returns Decoded payload or null if invalid
 */
export async function getAuthToken(request: NextRequest): Promise<JWTPayload | null> {
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}

/**
 * Middleware to require admin authentication
 * @param request - Next.js request object
 * @returns Decoded payload or throws error
 */
export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
    const payload = await getAuthToken(request);

    if (!payload || !payload.isAdmin) {
        throw new Error('Unauthorized: Invalid or missing token');
    }

    return payload;
}
