
import fs from 'fs';
import path from 'path';
import { sampleInventoryData } from '../src/data/inventoryData';

interface StockItem {
    id: string;
    name: string;
    type: string;
    size?: string;
    [key: string]: any;
}

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'stock-images');

function generatePrompts(item: StockItem): { prompt: string, filename: string }[] {
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        return hash;
    };
    const baseSeed = Math.abs(hashCode(item.id));
    const QUALITY_TAGS = "professional product photography, studio lighting, 4k ultra hd, sharp focus, high fidelity, neutral background";

    let index = 0;
    const createItem = (mainDescription: string, viewAngle: string) => {
        index++;
        const fullPrompt = `${mainDescription}, ${viewAngle}, ${QUALITY_TAGS}`;
        return {
            prompt: fullPrompt,
            filename: `${item.id}_${index}.jpg` // We check for .jpg as script generates jpg, but we might generate png. Check both?
        };
    };

    let items: { prompt: string, filename: string }[] = [];
    let desc = "";

    switch (item.type) {
        case 'Plushy':
            desc = `${item.name} plush toy, ${item.size || 'standard size'}, cute soft fluffy fabric texture, kawaii style`;
            items = [
                createItem(desc, "front view"),
                createItem(desc, "side view profile"),
                createItem(desc, "back view"),
                createItem(desc, "close-up detail of face softness")
            ];
            break;
        case 'Blind Box':
            desc = `${item.name}`;
            items = [
                createItem(`${desc} blind box packaging design, colorful box`, "front view"),
                createItem(`${desc} collectible vinyl figure toy, matte finish, high quality`, "front view"),
                createItem(`${desc} collectible vinyl figure toy, matte finish`, "side view"),
                createItem(`${desc} collectible vinyl figure toy, matte finish`, "close-up detail")
            ];
            break;
        case 'Figurine':
            desc = `${item.name} anime figure, high quality PVC, vibrant colors`;
            items = [
                createItem(desc, "full body front view"),
                createItem(desc, "side profile view"),
                createItem(desc, "back view"),
                createItem(desc, "dynamic action pose"),
                createItem(desc, "detailed face close-up")
            ];
            break;
        case 'Key Chain':
            desc = `${item.name} keychain charm`;
            items = [
                createItem(`${desc}, acrylic or metal texture`, "flat lay front view"),
                createItem(`${desc}, hanging with keyring`, "angled view"),
                createItem(`${desc}`, "back view")
            ];
            break;
        case 'Gatcha':
            desc = `${item.name} gashapon toy`;
            items = [
                createItem(`${desc}, inside plastic capsule`, "front view"),
                createItem(`${desc}, toy out of capsule`, "front view"),
                createItem(`${desc}, toy out of capsule`, "side view")
            ];
            break;
        default:
            desc = `${item.name} product`;
            items = [
                createItem(desc, "front view"),
                createItem(desc, "side view"),
                createItem(desc, "back view")
            ];
            break;
    }
    return items;
}

async function main() {
    const missingItems: { prompt: string, filename: string }[] = [];

    for (const item of sampleInventoryData) {
        // Cast to StockItem to match interface (inventoryData might have loose typing)
        const stockItem = item as unknown as StockItem;
        const tasks = generatePrompts(stockItem);

        for (const task of tasks) {
            const jpgPath = path.join(OUTPUT_DIR, task.filename);
            const pngPath = path.join(OUTPUT_DIR, task.filename.replace('.jpg', '.png')); // Check for PNG too

            if (!fs.existsSync(jpgPath) && !fs.existsSync(pngPath)) {
                missingItems.push(task);
            }
        }
    }

    console.log(JSON.stringify(missingItems, null, 2));
}

main().catch(console.error);
