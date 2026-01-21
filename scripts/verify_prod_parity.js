/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'api-config.json');
const REPORT_PATH = path.join(process.cwd(), 'parity_report.json');

// --- Configs ---
const LOCAL_CONFIG = {
    jotformApiUrl: "http://localhost:8000",
    jotformFormId: "614",
    jotformEnabled: true,
    gameReportApiUrl: "http://localhost:8000",
    gameReportSiteId: "614",
    gameReportEnabled: true,
    revenueApiUrl: "http://localhost:8000",
    revenueSiteId: "614",
    revenueEnabled: true,
    isEnabled: true,
    urlPresets: [
        { label: "Local Server (127.0.0.1)", value: "http://127.0.0.1:8000" },
        { label: "Local Server (localhost)", value: "http://localhost:8000" },
    ]
};

const PROD_CONFIG = {
    jotformApiUrl: "https://claw.kokoamusement.com.au",
    jotformFormId: "614",
    jotformEnabled: true,
    gameReportApiUrl: "https://claw.kokoamusement.com.au",
    gameReportSiteId: "614",
    gameReportEnabled: true,
    revenueApiUrl: "https://claw.kokoamusement.com.au",
    revenueSiteId: "614",
    revenueEnabled: true,
    isEnabled: true,
    urlPresets: [
        { label: "Production", value: "https://claw.kokoamusement.com.au" }
    ]
};

const TARGET_PATHS = [
    { name: 'Dashboard', path: '/' },
    { name: 'Monitoring', path: '/monitoring' },
    { name: 'Inventory', path: '/inventory/mac_migrated_182_361at' },
    { name: 'Machine Details', path: '/machines/mac_migrated_182_361at' },
    { name: 'Analytics', path: '/analytics' }
];

async function runTest(envName, config) {
    console.log(`\n=== Running Test: ${envName} ===`);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`Updated api-config.json for ${envName}`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const capturedData = [];

    // Capture responses
    page.on('response', async response => {
        const url = response.url();
        // Filter for API calls
        if (url.includes('/api/') && !url.includes('/api/settings')) {
            const request = response.request();
            let body = null;
            try {
                if (response.status() === 204) {
                    body = null;
                } else {
                    // Try to get text, handle potential errors if response is closed or redirect
                    body = await response.text();
                    try { body = JSON.parse(body); } catch (e) { }
                }
            } catch (e) { body = `[Error reading body: ${e.message}]`; }

            let postData = request.postData();
            // Try to parse postData as JSON if possible
            if (postData) {
                try { postData = JSON.parse(postData); } catch (e) { }
            }

            capturedData.push({
                timestamp: new Date().toISOString(),
                url: url,
                method: request.method(),
                statusCode: response.status(),
                requestBody: postData,
                responseBody: body,
            });
        }
    });

    for (const target of TARGET_PATHS) {
        const fullUrl = `http://localhost:3000${target.path}`;
        console.log(`Navigating to ${target.name}: ${fullUrl}`);

        try {
            await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.error(`Error visiting ${target.name}:`, e.message);
        }
    }

    await browser.close();
    return capturedData;
}

async function main() {
    let originalConfig = {};
    if (fs.existsSync(CONFIG_PATH)) {
        originalConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }

    try {
        const localRequests = await runTest('Local', LOCAL_CONFIG);
        const prodRequests = await runTest('Production', PROD_CONFIG);

        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                localCount: localRequests.length,
                prodCount: prodRequests.length
            },
            local: localRequests,
            production: prodRequests,
        };

        fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
        console.log(`\nSuccess! Report generated at ${REPORT_PATH}`);

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        if (originalConfig && Object.keys(originalConfig).length > 0) {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(originalConfig, null, 2));
            console.log("Restored original api-config.json");
        }
    }
}

main();
