import fs from 'fs';
import path from 'path';

const STOCK_IMAGES_DIR = path.join(process.cwd(), 'public', 'stock-images');
const INVENTORY_FILE = path.join(process.cwd(), 'src', 'data', 'inventoryData.ts');

interface ImageUpdate {
    id: string;
    hasLocal: boolean;
    localImages: string[];
}

function findLocalImages(itemId: string): string[] {
    const images: string[] = [];
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    // Look for numbered images: _1, _2, _3, _4, _5 (up to 10 max)
    for (let i = 1; i <= 10; i++) {
        for (const ext of possibleExtensions) {
            const filename = `${itemId}_${i}${ext}`;
            const filepath = path.join(STOCK_IMAGES_DIR, filename);
            if (fs.existsSync(filepath)) {
                images.push(`/stock-images/${filename}`);
                break; // Found this number, move to next
            }
        }
    }

    // Also check for legacy named files (_front, _side, _back, _item)
    const legacySuffixes = ['_front', '_side', '_back', '_item'];
    for (const suffix of legacySuffixes) {
        for (const ext of possibleExtensions) {
            const filename = `${itemId}${suffix}${ext}`;
            const filepath = path.join(STOCK_IMAGES_DIR, filename);
            if (fs.existsSync(filepath) && !images.includes(`/stock-images/${filename}`)) {
                images.push(`/stock-images/${filename}`);
                break;
            }
        }
    }

    return images;
}

function main() {
    console.log('Scanning for local images...\n');

    // Read the inventory file
    let content = fs.readFileSync(INVENTORY_FILE, 'utf-8');

    // Find all item IDs using regex
    const idMatches = content.matchAll(/"id":\s*"([^"]+)"/g);
    const updates: ImageUpdate[] = [];

    for (const match of idMatches) {
        const id = match[1];
        const localImages = findLocalImages(id);
        updates.push({
            id,
            hasLocal: localImages.length > 0,
            localImages
        });
    }

    // Count stats
    const withLocal = updates.filter(u => u.hasLocal).length;
    const withoutLocal = updates.filter(u => !u.hasLocal).length;

    console.log(`Found ${updates.length} items total`);
    console.log(`  ✓ ${withLocal} items have local images`);
    console.log(`  ✗ ${withoutLocal} items still need images\n`);

    // Apply updates
    let updatedCount = 0;
    for (const update of updates) {
        if (update.localImages.length >= 1) {
            // Create the new imageUrl and imageUrls values
            const mainImage = update.localImages[0];
            const allImages = JSON.stringify(update.localImages, null, 12).replace(/\n/g, '\n        ');

            // Find and replace the imageUrl for this specific item
            // We need to be careful to only replace within this item's block
            const idPattern = `"id": "${update.id}"`;
            const idIndex = content.indexOf(idPattern);

            if (idIndex === -1) continue;

            // Find the next item or end of array (next "id": or end bracket)
            const nextIdIndex = content.indexOf('"id":', idIndex + idPattern.length);
            const blockEnd = nextIdIndex === -1 ? content.length : nextIdIndex;

            // Extract the block for this item
            const blockStart = idIndex;
            let block = content.substring(blockStart, blockEnd);

            // Check if already using local images
            if (block.includes('/stock-images/')) {
                continue; // Already updated
            }

            // Replace imageUrl
            const imageUrlRegex = /"imageUrl":\s*"[^"]+"/;
            if (imageUrlRegex.test(block)) {
                block = block.replace(imageUrlRegex, `"imageUrl": "${mainImage}"`);
            }

            // Replace imageUrls array
            const imageUrlsRegex = /\"imageUrls\":\s*\[[\s\S]*?\]/;
            if (imageUrlsRegex.test(block)) {
                block = block.replace(imageUrlsRegex, `"imageUrls": ${allImages}`);
            }

            // Put the block back
            content = content.substring(0, blockStart) + block + content.substring(blockEnd);
            updatedCount++;
        }
    }

    // Write back
    fs.writeFileSync(INVENTORY_FILE, content);

    console.log(`✅ Updated ${updatedCount} items to use local images`);
    console.log(`\nDone! Refresh your browser to see the changes.`);

    // List items without images
    if (withoutLocal > 0) {
        console.log(`\n⚠️  Items still missing local images:`);
        updates.filter(u => !u.hasLocal).slice(0, 10).forEach(u => {
            console.log(`   - ${u.id}`);
        });
        if (withoutLocal > 10) {
            console.log(`   ... and ${withoutLocal - 10} more`);
        }
    }
}

main();
