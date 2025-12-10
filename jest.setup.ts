import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    auth: null,
    db: null,
    storage: null,
    isFirebaseInitialized: false,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
                args[0].includes('act(...)'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
