import fs from 'fs';
import path from 'path';
import { sampleInventoryData } from '../src/data/inventoryData';

const BACKUP_DIR = path.join(process.cwd(), 'public', 'stock-images-backup');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
    if (fs.existsSync(filepath)) {
        return true; // Already exists, skip silently
    }

    if (url.startsWith('/')) {
        return false; // Local path, skip
    }

    try {
        const response = await fetch(url);
        if (!response.ok) return false;
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filepath, Buffer.from(buffer));
        console.log(`  ✅ ${path.basename(filepath)}`);
        return true;
    } catch (error) {
        return false;
    }
}

async function main() {
    console.log('🚀 FAST BACKUP: Downloading 10 images at a time!\n');

    // Collect all download tasks
    const tasks: { url: string, path: string, id: string }[] = [];

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
            const filepath = path.join(BACKUP_DIR, filename);

            // Skip if already exists
            if (!fs.existsSync(filepath)) {
                tasks.push({ url: urls[i], path: filepath, id: itemAny.id });
            }
        }
    }

    console.log(`📥 ${tasks.length} images to download (existing files skipped)\n`);

    if (tasks.length === 0) {
        console.log('✅ All images already backed up!');
        return;
    }

    // Download in parallel batches of 10
    const batchSize = 10;
    let downloaded = 0;
    let failed = 0;

    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}...`);

        const results = await Promise.all(batch.map(t => downloadImage(t.url, t.path)));
        downloaded += results.filter(r => r).length;
        failed += results.filter(r => !r).length;

        // Small delay between batches
        if (i + batchSize < tasks.length) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log(`\n✅ Done! Downloaded: ${downloaded}, Failed: ${failed}`);
}

main().catch(console.error);
