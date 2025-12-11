import fs from 'fs';
import path from 'path';
import { sampleInventoryData } from '../src/data/inventoryData';

const BACKUP_DIR = path.join(process.cwd(), 'public', 'stock-images-backup');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Cache existing files at startup for FAST lookup
const EXISTING_FILES = new Set(fs.readdirSync(BACKUP_DIR));
console.log(`📂 Found ${EXISTING_FILES.size} existing backups\n`);

async function downloadImage(url: string, filepath: string, retries: number = 3): Promise<boolean> {
    const filename = path.basename(filepath);

    // Fast lookup using cached Set
    if (EXISTING_FILES.has(filename)) {
        return true; // Already exists
    }

    if (url.startsWith('/')) {
        return false; // Local path, skip
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);

            // Handle rate limit
            if (response.status === 429) {
                const waitTime = attempt * 2000;
                console.log(`  ⏳ Rate limited, wait ${waitTime / 1000}s...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filepath, Buffer.from(buffer));
            EXISTING_FILES.add(filename); // Add to cache
            console.log(`  ✅ ${filename}`);
            return true;
        } catch (error) {
            if (attempt === retries) {
                console.log(`  ❌ ${filename} (failed after ${retries} tries)`);
                return false;
            }
            console.log(`  ⚠️ Retry ${attempt}...`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    return false;
}

async function main() {
    console.log('🚀 FAST BACKUP with retry logic!\n');

    // Collect all download tasks - using cached lookup
    const tasks: { url: string, path: string }[] = [];

    for (const item of sampleInventoryData) {
        const itemAny = item as any;
        const urls: string[] = [];

        if (itemAny.imageUrl && !itemAny.imageUrl.startsWith('/')) {
            urls.push(itemAny.imageUrl);
        }
        if (itemAny.imageUrls && Array.isArray(itemAny.imageUrls)) {
            for (const url of itemAny.imageUrls) {
                if (url && !url.startsWith('/') && !urls.includes(url)) {
                    urls.push(url);
                }
            }
        }

        for (let i = 0; i < urls.length; i++) {
            const filename = `${itemAny.id}_${i + 1}.jpg`;
            // Fast check using cached Set
            if (!EXISTING_FILES.has(filename)) {
                tasks.push({ url: urls[i], path: path.join(BACKUP_DIR, filename) });
            }
        }
    }

    console.log(`📥 ${tasks.length} images to download\n`);

    if (tasks.length === 0) {
        console.log('✅ All images already backed up!');
        return;
    }

    // Download in parallel batches
    const batchSize = 3;
    let downloaded = 0;
    let failed = 0;

    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}...`);

        const results = await Promise.all(batch.map(t => downloadImage(t.url, t.path)));
        downloaded += results.filter(r => r).length;
        failed += results.filter(r => !r).length;

        // Short delay between batches
        if (i + batchSize < tasks.length) {
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log(`\n✅ Done! Downloaded: ${downloaded}, Failed: ${failed}`);
}

main().catch(console.error);
