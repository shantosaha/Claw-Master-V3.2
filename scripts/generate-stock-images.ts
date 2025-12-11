
import fs from 'fs';
import path from 'path';
import { sampleInventoryData } from '../src/data/inventoryData';

// Proxy support (optional) - set HTTPS_PROXY environment variable
// Example: HTTPS_PROXY=http://proxy.example.com:8080 npx tsx scripts/generate-stock-images.ts
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || null;
if (PROXY_URL) {
    console.log(`🌐 Using proxy: ${PROXY_URL}`);
}

// We need to define the type locally since we can't easily import types in this standalone script setup without ts-node config
interface StockItem {
    id: string;
    name: string;
    type: string;
    size?: string;
    [key: string]: any;
}

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'stock-images');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Cache existing files at startup for FAST lookup (no disk I/O per check)
const EXISTING_FILES = new Set(fs.readdirSync(OUTPUT_DIR));
console.log(`📂 Found ${EXISTING_FILES.size} existing images (will skip)\n`);

const DELAY_MS = 2000; // 2 second delay for reliability

// Use only the best quality model for consistency
function getApiUrl(prompt: string, seed: number): string {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
}

async function downloadImage(url: string, filepath: string, retries: number = 5): Promise<boolean> {
    const filename = path.basename(filepath);
    const filenameNoExt = filename.replace('.jpg', '');

    // Fast lookup - check for both .jpg and .png versions
    if (EXISTING_FILES.has(filename) || EXISTING_FILES.has(filenameNoExt + '.png')) {
        return true; // Skip silently for speed
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);

            // Handle rate limit - wait and retry with exponential backoff
            if (response.status === 429) {
                const waitTime = attempt * 5000; // 5s, 10s, 15s (safe for overnight)
                console.log(`  ⏳ Rate limited, waiting ${waitTime / 1000}s...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filepath, Buffer.from(buffer));
            console.log(`  ✅ Downloaded: ${path.basename(filepath)}`);
            return true;
        } catch (error) {
            if (attempt === retries) {
                console.log(`  ❌ Failed: ${path.basename(filepath)} (after ${retries} attempts)`);
                return false;
            }
            console.log(`  ⚠️ Retry ${attempt}...`);
            await new Promise(r => setTimeout(r, 5000)); // Wait 5s before retry (safe for overnight)
        }
    }
    return false;
}


// ============================================================================
// 🧠 PREMIUM PROMPT ENGINE
// Generates high-fidelity, studio-quality prompts based on item metadata
// ============================================================================
function generatePrompts(item: StockItem): string[] {
    // 1. Consistent Seed Logic
    // Using a hash of the ID ensures the same item always gets the same "character/style"
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        return hash;
    };
    const baseSeed = Math.abs(hashCode(item.id));

    // 2. Base Quality Keywords (The "Secret Sauce")
    const QUALITY_TAGS = "professional product photography, studio lighting, 4k ultra hd, sharp focus, high fidelity, neutral background";

    // 3. Helper to build the URL
    // We add specific view keywords to the seed to get different angles of the SAME object
    const createUrl = (mainDescription: string, viewAngle: string, viewSeedOffset: number) => {
        const fullPrompt = `${mainDescription}, ${viewAngle}, ${QUALITY_TAGS}`;
        // We use the baseSeed but vary it slightly per view to ensure stability while changing angles
        // Actually, for consistency, we usually want the SAME seed but different prompts. 
        // Pollinations/Flux handles "side view" better if we keep the seed or vary it slightly.
        // Let's keep the seed fixed for character consistency!
        return getApiUrl(fullPrompt, baseSeed + viewSeedOffset);
    };

    let views: string[] = [];
    let desc = "";

    // 4. Category-Specific Logic
    switch (item.type) {
        case 'Plushy':
            // "Plushies" need softness and texture keywords
            desc = `${item.name} plush toy, ${item.size || 'standard size'}, cute soft fluffy fabric texture, kawaii style`;
            views = [
                createUrl(desc, "front view", 0),
                createUrl(desc, "side view profile", 1),
                createUrl(desc, "back view", 2),
                createUrl(desc, "close-up detail of face softness", 3)
            ];
            break;

        case 'Blind Box':
            // "Blind Boxes" need vinyl/plastic texture and packaging
            desc = `${item.name}`;
            views = [
                createUrl(`${desc} blind box packaging design, colorful box`, "front view", 0),
                createUrl(`${desc} collectible vinyl figure toy, matte finish, high quality`, "front view", 1),
                createUrl(`${desc} collectible vinyl figure toy, matte finish`, "side view", 2),
                createUrl(`${desc} collectible vinyl figure toy, matte finish`, "close-up detail", 3)
            ];
            break;

        case 'Figurine':
            // "Figurines" need PVC/smooth texture and dynamic poses
            desc = `${item.name} anime figure, high quality PVC, vibrant colors`;
            views = [
                createUrl(desc, "full body front view", 0),
                createUrl(desc, "side profile view", 1),
                createUrl(desc, "back view", 2),
                createUrl(desc, "dynamic action pose", 3),
                createUrl(desc, "detailed face close-up", 4)
            ];
            break;

        case 'Key Chain':
            // "Keychains" need metal/acrylic texture
            desc = `${item.name} keychain charm`;
            views = [
                createUrl(`${desc}, acrylic or metal texture`, "flat lay front view", 0),
                createUrl(`${desc}, hanging with keyring`, "angled view", 1),
                createUrl(`${desc}`, "back view", 2)
            ];
            break;

        case 'Gatcha':
            desc = `${item.name} gashapon toy`;
            views = [
                createUrl(`${desc}, inside plastic capsule`, "front view", 0),
                createUrl(`${desc}, toy out of capsule`, "front view", 1),
                createUrl(`${desc}, toy out of capsule`, "side view", 2)
            ];
            break;

        default:
            // Fallback for others
            desc = `${item.name} product`;
            views = [
                createUrl(desc, "front view", 0),
                createUrl(desc, "side view", 1),
                createUrl(desc, "back view", 2)
            ];
            break;
    }

    return views;
}

async function processItem(item: StockItem): Promise<{ url: string, path: string }[]> {
    const prompts = generatePrompts(item);

    // Return array of download tasks (don't download yet)
    return prompts.map((url, i) => ({
        url,
        path: path.join(OUTPUT_DIR, `${item.id}_${i + 1}.jpg`)
    }));
}

// Process multiple downloads in parallel
async function downloadBatch(tasks: { url: string, path: string }[], batchSize: number = 10) {
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        console.log(`\n📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)} (${batch.length} images)...`);

        // Download all in batch simultaneously
        const results = await Promise.all(batch.map(task => downloadImage(task.url, task.path)));
        successCount += results.filter(r => r).length;
        failCount += results.filter(r => !r).length;

        // Delay between batches (safe for overnight)
        if (i + batchSize < tasks.length) {
            console.log(`  ⏸️  Wait 5s...`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log(`\n📊 Results: ${successCount} downloaded, ${failCount} failed`);
}

async function main() {
    // Process arguments: --start, --limit, --parallel
    const args = process.argv.slice(2);
    const startArg = args.find(arg => arg.startsWith('--start='));
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const parallelArg = args.find(arg => arg.startsWith('--parallel='));

    const start = startArg ? parseInt(startArg.split('=')[1]) : 0;
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : sampleInventoryData.length;
    const parallel = parallelArg ? parseInt(parallelArg.split('=')[1]) : 10;

    console.log(`🚀 PARALLEL MODE: Downloading ${parallel} images simultaneously!`);
    console.log(`Processing ${limit} items...`);

    const itemsToProcess = sampleInventoryData.slice(start, start + limit);

    // Collect ALL download tasks first, filtering out existing files
    let allTasks: { url: string, path: string }[] = [];

    for (const item of itemsToProcess) {
        const tasks = await processItem(item);
        // Filter out existing files immediately
        for (const task of tasks) {
            const filename = path.basename(task.path);
            const filenameNoExt = filename.replace('.jpg', '');
            if (!EXISTING_FILES.has(filename) && !EXISTING_FILES.has(filenameNoExt + '.png')) {
                allTasks.push(task);
            }
        }
    }

    if (allTasks.length === 0) {
        console.log('\n✅ All images already exist! Nothing to download.');
        return;
    }

    console.log(`\n📥 ${allTasks.length} missing images to download\n`);

    // Download all in parallel batches
    await downloadBatch(allTasks, parallel);

    console.log("\n✅ Done!");
}

main().catch(console.error);

