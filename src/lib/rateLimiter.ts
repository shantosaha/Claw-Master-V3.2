/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter for client-side protection
 * For production, consider using a distributed solution like Redis
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
};

// Predefined limits for different action types
export const RATE_LIMITS = {
    // Authentication actions
    login: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
    signup: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 per minute

    // Data mutations
    create: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
    update: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 per minute
    delete: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute

    // Read operations
    read: { maxRequests: 200, windowMs: 60 * 1000 }, // 200 per minute

    // File operations
    upload: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute

    // General API calls
    api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Clean up expired entries every minute
        if (typeof window !== 'undefined') {
            this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
        }
    }

    /**
     * Check if an action is allowed under rate limiting
     * @param key Unique identifier for the rate limit (e.g., userId + action)
     * @param config Rate limit configuration
     * @returns Object with allowed status and remaining requests
     */
    check(key: string, config: RateLimitConfig = DEFAULT_CONFIG): {
        allowed: boolean;
        remaining: number;
        resetIn: number;
    } {
        const now = Date.now();
        const entry = this.limits.get(key);

        if (!entry || now > entry.resetTime) {
            // First request or window has reset
            this.limits.set(key, {
                count: 1,
                resetTime: now + config.windowMs,
            });
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetIn: config.windowMs,
            };
        }

        if (entry.count >= config.maxRequests) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                resetIn: entry.resetTime - now,
            };
        }

        // Increment count
        entry.count++;
        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetIn: entry.resetTime - now,
        };
    }

    /**
     * Check rate limit for a predefined action type
     */
    checkAction(userId: string, action: RateLimitType): {
        allowed: boolean;
        remaining: number;
        resetIn: number;
    } {
        const key = `${userId}:${action}`;
        const config = RATE_LIMITS[action];
        return this.check(key, config);
    }

    /**
     * Wrapper function that throws an error if rate limited
     */
    enforce(key: string, config: RateLimitConfig = DEFAULT_CONFIG): void {
        const result = this.check(key, config);
        if (!result.allowed) {
            const resetInSeconds = Math.ceil(result.resetIn / 1000);
            throw new RateLimitError(
                `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
                result.resetIn
            );
        }
    }

    /**
     * Enforce rate limit for a predefined action type
     */
    enforceAction(userId: string, action: RateLimitType): void {
        const key = `${userId}:${action}`;
        const config = RATE_LIMITS[action];
        this.enforce(key, config);
    }

    /**
     * Reset rate limit for a specific key
     */
    reset(key: string): void {
        this.limits.delete(key);
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }

    /**
     * Destroy the rate limiter (cleanup interval)
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.limits.clear();
    }
}

/**
 * Custom error class for rate limiting
 */
export class RateLimitError extends Error {
    public readonly resetIn: number;

    constructor(message: string, resetIn: number) {
        super(message);
        this.name = 'RateLimitError';
        this.resetIn = resetIn;
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * React hook for rate limiting
 */
export function useRateLimit() {
    const check = (userId: string, action: RateLimitType) => {
        return rateLimiter.checkAction(userId, action);
    };

    const enforce = (userId: string, action: RateLimitType) => {
        return rateLimiter.enforceAction(userId, action);
    };

    return { check, enforce };
}

/**
 * Higher-order function to wrap async operations with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    userId: string,
    action: RateLimitType
): T {
    return (async (...args: Parameters<T>) => {
        rateLimiter.enforceAction(userId, action);
        return fn(...args);
    }) as T;
}
