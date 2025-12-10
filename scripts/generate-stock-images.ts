
import fs from 'fs';
import path from 'path';
import { sampleInventoryData } from '../src/data/inventoryData';

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

const DELAY_MS = 2000; // 2 second delay for reliability

// Use only the best quality model for consistency
function getApiUrl(prompt: string, seed: number): string {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
}

async function downloadImage(url: string, filepath: string, retries: number = 5): Promise<boolean> {
    if (fs.existsSync(filepath)) {
        console.log(`  ✓ Exists: ${path.basename(filepath)}`);
        return true;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);

            // Handle rate limit - wait and retry with exponential backoff
            if (response.status === 429) {
                const waitTime = attempt * 10000; // 10s, 20s, 30s, 40s, 50s
                console.log(`  ⏳ Rate limited, waiting ${waitTime / 1000}s... (attempt ${attempt}/${retries})`);
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
            console.log(`  ⚠️ Retry ${attempt}/${retries} for ${path.basename(filepath)}...`);
            await new Promise(r => setTimeout(r, 5000)); // Wait 5s before retry
        }
    }
    return false;
}

function generatePrompts(item: StockItem): string[] {
    // Use consistent seed based on item ID - ensures all images of same item look alike
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    const baseSeed = hashCode(item.id); // Same seed for all views of this item
    const sizeDesc = item.size ? `${item.size} size` : "";

    // All views use the SAME base seed for consistency
    const createUrl = (prompt: string, view: string) => {
        const fullPrompt = `${prompt}, ${view}, same character same style same colors, professional product photo, high quality, 4k`;
        return getApiUrl(fullPrompt, baseSeed); // Same seed = consistent look
    };

    let views: string[] = [];

    if (item.type === 'Plushy') {
        // Plushies get 4 images: front, side, back, close-up
        views = [
            createUrl(`${item.name} plush toy ${sizeDesc}, cute soft fluffy`, "front view"),
            createUrl(`${item.name} plush toy ${sizeDesc}, cute soft fluffy`, "side view"),
            createUrl(`${item.name} plush toy ${sizeDesc}, cute soft fluffy`, "back view"),
            createUrl(`${item.name} plush toy ${sizeDesc}, cute soft fluffy`, "close-up face detail")
        ];
    } else if (item.type === 'Blind Box') {
        // Blind boxes get 4 images: box, figure front, side, detail
        views = [
            createUrl(`${item.name} blind box packaging`, "sealed box front view"),
            createUrl(`${item.name} collectible figure vinyl toy`, "front view"),
            createUrl(`${item.name} collectible figure vinyl toy`, "side angle"),
            createUrl(`${item.name} collectible figure vinyl toy`, "detail close-up")
        ];
    } else if (item.type === 'Figurine') {
        // Figurines get 5 images: front, side, back, dynamic, detail
        views = [
            createUrl(`${item.name} anime figure PVC collectible`, "full body front view"),
            createUrl(`${item.name} anime figure PVC collectible`, "side profile"),
            createUrl(`${item.name} anime figure PVC collectible`, "back view"),
            createUrl(`${item.name} anime figure PVC collectible`, "dynamic action pose"),
            createUrl(`${item.name} anime figure PVC collectible`, "face detail close-up")
        ];
    } else if (item.type === 'Key Chain') {
        // Keychains get 3 images
        views = [
            createUrl(`${item.name} keychain charm`, "front view flat lay"),
            createUrl(`${item.name} keychain charm`, "angled view with keyring"),
            createUrl(`${item.name} keychain charm`, "back view")
        ];
    } else if (item.type === 'Gatcha') {
        // Gatcha get 3 images
        views = [
            createUrl(`${item.name} capsule toy`, "inside capsule"),
            createUrl(`${item.name} capsule toy`, "front view"),
            createUrl(`${item.name} capsule toy`, "side angle")
        ];
    } else {
        // Default 3 images
        views = [
            createUrl(`${item.name}`, "front view"),
            createUrl(`${item.name}`, "side view"),
            createUrl(`${item.name}`, "back view")
        ];
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

        // Longer delay between batches to avoid rate limits
        if (i + batchSize < tasks.length) {
            console.log(`  ⏸️  Waiting 10s before next batch...`);
            await new Promise(r => setTimeout(r, 10000));
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
    console.log(`Starting from item ${start}, processing ${limit} items...\n`);

    const itemsToProcess = sampleInventoryData.slice(start, start + limit);

    // Collect ALL download tasks first
    let allTasks: { url: string, path: string }[] = [];

    for (const item of itemsToProcess) {
        const tasks = await processItem(item);
        console.log(`[${item.id}] ${item.name} - ${tasks.length} images queued`);
        allTasks = allTasks.concat(tasks);
    }

    console.log(`\n📥 Total: ${allTasks.length} images to download\n`);

    // Download all in parallel batches
    await downloadBatch(allTasks, parallel);

    console.log("\n✅ Done!");
}

main().catch(console.error);

