/**
 * Professional Logger Service
 * Provides structured logging with timestamps and log levels
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: any;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV !== 'production';

    private formatTimestamp(): string {
        return new Date().toISOString();
    }

    private formatMessage(entry: LogEntry): string {
        const { timestamp, level, context, message, data } = entry;
        const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level}] [${context}] ${message}${dataStr}`;
    }

    private log(level: LogLevel, context: string, message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: this.formatTimestamp(),
            level,
            context,
            message,
            data,
        };

        const formattedMessage = this.formatMessage(entry);

        // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
        if (this.isDevelopment) {
            switch (level) {
                case 'ERROR':
                    console.error(formattedMessage);
                    break;
                case 'WARN':
                    console.warn(formattedMessage);
                    break;
                case 'SUCCESS':
                    console.log(`✅ ${formattedMessage}`);
                    break;
                case 'DEBUG':
                    console.debug(formattedMessage);
                    break;
                default:
                    console.log(formattedMessage);
            }
        } else {
            // In production, log everything as JSON for easier parsing
            console.log(JSON.stringify(entry));
        }
    }

    info(context: string, message: string, data?: any) {
        this.log('INFO', context, message, data);
    }

    warn(context: string, message: string, data?: any) {
        this.log('WARN', context, message, data);
    }

    error(context: string, message: string, data?: any) {
        this.log('ERROR', context, message, data);
    }

    success(context: string, message: string, data?: any) {
        this.log('SUCCESS', context, message, data);
    }

    debug(context: string, message: string, data?: any) {
        if (this.isDevelopment) {
            this.log('DEBUG', context, message, data);
        }
    }

    // API-specific logging helpers
    apiRequest(method: string, path: string, data?: any) {
        this.info('API', `${method} ${path}`, data);
    }

    apiSuccess(method: string, path: string, data?: any) {
        this.success('API', `${method} ${path} - Success`, data);
    }

    apiError(method: string, path: string, error: any) {
        this.error('API', `${method} ${path} - Failed`, {
            error: error.message || error,
            stack: error.stack,
        });
    }

    // Auth-specific logging helpers
    authAttempt(identifier: string) {
        this.info('AUTH', `Login attempt`, { identifier });
    }

    authSuccess(identifier: string) {
        this.success('AUTH', `Login successful`, { identifier });
    }

    authFailure(identifier: string, reason: string) {
        this.warn('AUTH', `Login failed`, { identifier, reason });
    }

    authLogout(identifier: string) {
        this.info('AUTH', `Logout`, { identifier });
    }

    // Database-specific logging helpers
    dbQuery(operation: string, collection: string, data?: any) {
        this.debug('DB', `${operation} on ${collection}`, data);
    }

    dbError(operation: string, collection: string, error: any) {
        this.error('DB', `${operation} on ${collection} failed`, {
            error: error.message || error,
        });
    }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel, LogEntry };
