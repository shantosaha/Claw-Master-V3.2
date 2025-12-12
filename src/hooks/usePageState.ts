"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface PageStateOptions<T> {
    /** Unique key to identify this page's state in storage */
    key: string;
    /** Initial/default state values */
    initialState: T;
    /** Whether to persist scroll position */
    persistScroll?: boolean;
    /** Storage type - sessionStorage persists during browser session, localStorage persists longer */
    storage?: 'session' | 'local';
    /** Optional dependency to trigger scroll restoration (e.g. when data finishes loading) */
    isReady?: boolean;
    /** Optional selector for the scroll container (defaults to window if not found/provided) */
    scrollSelector?: string;
}

/**
 * Custom hook to persist page state (filters, view mode, scroll position) across navigation.
 * State is restored when returning to the page.
 */
export function usePageState<T extends Record<string, any>>({
    key,
    initialState,
    persistScroll = true,
    storage = 'session',
    isReady = true,
    scrollSelector
}: PageStateOptions<T>) {
    const storageKey = `page-state-${key}`;
    const scrollKey = `page-scroll-${key}`;
    const isInitialized = useRef(false);
    const scrollRestored = useRef(false);

    // Get storage instance
    const getStorage = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return storage === 'session' ? sessionStorage : localStorage;
    }, [storage]);

    // Load initial state from storage
    const loadState = useCallback((): T => {
        const storageInstance = getStorage();
        if (!storageInstance) return initialState;

        try {
            const saved = storageInstance.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with initial state to handle new properties
                return { ...initialState, ...parsed };
            }
        } catch (e) {
            console.warn(`Failed to load page state for ${key}:`, e);
        }
        return initialState;
    }, [getStorage, storageKey, initialState, key]);

    // Initialize state from storage
    const [state, setState] = useState<T>(() => loadState());

    // Save state to storage whenever it changes
    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            return;
        }

        const storageInstance = getStorage();
        if (!storageInstance) return;

        try {
            storageInstance.setItem(storageKey, JSON.stringify(state));
        } catch (e) {
            console.warn(`Failed to save page state for ${key}:`, e);
        }
    }, [state, getStorage, storageKey, key]);

    // Save scroll position before leaving page
    useEffect(() => {
        if (!persistScroll) return;

        const getScrollY = () => {
            if (scrollSelector) {
                const el = document.querySelector(scrollSelector);
                if (el) return el.scrollTop;
            }
            return window.scrollY;
        };

        const handleBeforeUnload = () => {
            const storageInstance = getStorage();
            if (!storageInstance) return;

            try {
                storageInstance.setItem(scrollKey, String(getScrollY()));
            } catch (e) {
                console.warn(`Failed to save scroll position for ${key}:`, e);
            }
        };

        // Save on visibility change (more reliable for SPA navigation)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleBeforeUnload();
            }
        };

        // Also save periodically for SPA navigation
        const saveScrollPosition = () => {
            const storageInstance = getStorage();
            if (!storageInstance) return;
            try {
                storageInstance.setItem(scrollKey, String(getScrollY()));
            } catch (e) {
                // Ignore
            }
        };

        // Use scroll listener with debounce
        let scrollTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(saveScrollPosition, 100);
        };

        const target = scrollSelector ? document.querySelector(scrollSelector) : window;
        // If target not found yet, we might need to retry or attach to window fallback. 
        // For now, assume window tracking if selector missing, but we really need the element.
        // If selector is provided but logic returns null, we can't attach listener.
        // We'll trust the caller passes a valid selector that exists or will exist.

        // Actually, attach to window is safe fallback, but for scroll element we need ITs scroll event.
        if (target) {
            target.addEventListener('scroll', handleScroll, { passive: true } as any);
        }

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(scrollTimeout);
            handleBeforeUnload(); // Save on unmount
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (target) {
                target.removeEventListener('scroll', handleScroll as any);
            }
        };
    }, [persistScroll, getStorage, scrollKey, key, isReady, scrollSelector]);

    // Restore scroll position on mount or when ready
    useEffect(() => {
        if (!persistScroll || scrollRestored.current || !isReady) return;

        const storageInstance = getStorage();
        if (!storageInstance) return;

        // Delay scroll restoration to allow content to render
        const restoreScroll = () => {
            try {
                const savedScroll = storageInstance.getItem(scrollKey);
                if (savedScroll) {
                    const scrollY = parseInt(savedScroll, 10);
                    if (!isNaN(scrollY) && scrollY > 0) {
                        if (scrollSelector) {
                            const el = document.querySelector(scrollSelector);
                            if (el) {
                                el.scrollTop = scrollY;
                                scrollRestored.current = true;
                            }
                        } else {
                            window.scrollTo({ top: scrollY, behavior: 'instant' });
                            scrollRestored.current = true;
                        }
                    }
                }
            } catch (e) {
                console.warn(`Failed to restore scroll position for ${key}:`, e);
            }
        };

        // Try immediately
        restoreScroll();

        // Also try after a short delay to handle async content loading
        const timeoutId = setTimeout(restoreScroll, 100);
        const timeoutId2 = setTimeout(restoreScroll, 300);

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(timeoutId2);
        };
    }, [persistScroll, getStorage, scrollKey, key, isReady, scrollSelector]);

    // Update a specific field
    const updateState = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setState(prev => ({ ...prev, [field]: value }));
    }, []);

    // Update multiple fields at once
    const updateMultiple = useCallback((updates: Partial<T>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Reset to initial state
    const resetState = useCallback(() => {
        setState(initialState);
        const storageInstance = getStorage();
        if (storageInstance) {
            try {
                storageInstance.removeItem(storageKey);
                storageInstance.removeItem(scrollKey);
            } catch (e) {
                // Ignore
            }
        }
    }, [initialState, getStorage, storageKey, scrollKey]);

    return {
        state,
        setState,
        updateState,
        updateMultiple,
        resetState,
    };
}
