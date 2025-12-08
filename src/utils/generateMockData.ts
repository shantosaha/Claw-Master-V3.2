import { StockItem } from "@/types";

const CATEGORIES = ["Plushy", "Figure", "Electronics", "Snack", "Accessory", "Toy"];
const SIZES = ["Small", "Medium", "Large", "Big"];

const ADJECTIVES = [
    "Cute", "Fluffy", "Soft", "Giant", "Tiny", "Collectible", "Rare", "Limited Edition",
    "Sparkly", "Glow-in-the-Dark", "Vintage Style", "Modern", "Rainbow", "Golden", "Silver"
];

const CHARACTERS = [
    "Pikachu", "Mario", "Sonic", "Hello Kitty", "Totoro", "Naruto", "Goku", "Luffy",
    "Spider-Man", "Batman", "Iron Man", "Baby Yoda", "Minion", "SpongeBob", "Mickey Mouse",
    "Unicorn", "Dragon", "Bear", "Cat", "Dog", "Shark", "Penguin", "Dinosaur",
    "Bubble Tea", "Avocado", "Sushi"
];

const BRANDS = [
    "Nintendo", "Sega", "Sanrio", "Disney", "Marvel", "DC Comics", "Bandai", "Funko",
    "Generic", "Pokemon Center", "Ghibli", "Nickelodeon"
];

const LOCATIONS = [
    "B-Plushy Room", "G-Storage Room", "B-Capsule Room", "L-Storage Room",
    "Warehouse Alpha", "Warehouse Bravo"
];

const STATUSES = ["Organized", "Arrived", "Ordered", "Requested", "Low Stock"];
const ASSIGNED_STATUSES = ["Assigned", "Not Assigned", "Assigned for Replacement"];

export function generateMockStockItems(count: number): StockItem[] {
    const items: StockItem[] = [];

    // Ensure we cover all categories and sizes at least once
    const baseCombinations: { category: string; size: string }[] = [];
    CATEGORIES.forEach(cat => {
        SIZES.forEach(size => {
            baseCombinations.push({ category: cat, size });
        });
    });

    for (let i = 0; i < count; i++) {
        let category: string;
        let size: string;

        // First, exhaust the base combinations to ensure full coverage
        if (i < baseCombinations.length) {
            category = baseCombinations[i].category;
            size = baseCombinations[i].size;
        } else {
            category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            size = SIZES[Math.floor(Math.random() * SIZES.length)];
        }

        const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];

        const name = `${brand} - ${character} ${adjective} (${category})`;
        const id = `mock_${Date.now()}_${i}`;
        const sku = `${category.substring(0, 3).toUpperCase()}-${size.substring(0, 1)}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;

        // Generate relevant image using the character name as keyword
        // Using pollinations.ai as it supports prompt-based generation which fits the project style
        const imagePrompt = `${character} ${category} ${adjective} toy product view, white background`;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=400&height=400&nologo=true`;

        const cost = Number((Math.random() * 20 + 1).toFixed(2));
        const value = Math.floor(cost * (Math.random() * 2 + 1.5)); // Value is 1.5x - 3.5x cost

        const totalQty = Math.floor(Math.random() * 100);
        const lowStockThreshold = Math.floor(totalQty * 0.2);

        // Distribute stock across random locations
        const itemLocations = [];
        let remainingQty = totalQty;
        const numLocs = Math.floor(Math.random() * 2) + 1; // 1 or 2 locations

        for (let j = 0; j < numLocs; j++) {
            const locName = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
            const qty = j === numLocs - 1 ? remainingQty : Math.floor(remainingQty / 2);
            itemLocations.push({ locationName: locName, quantity: qty });
            remainingQty -= qty;
        }

        const item: StockItem = {
            id,
            name,
            sku,
            category,
            type: category, // For compatibility
            size,
            brand,
            tags: [character, adjective, category],
            stockStatus: STATUSES[Math.floor(Math.random() * STATUSES.length)],
            assignedStatus: ASSIGNED_STATUSES[Math.floor(Math.random() * ASSIGNED_STATUSES.length)],
            imageUrl,
            imageUrls: [imageUrl],
            totalQuantity: totalQty,
            quantity: totalQty,
            quantityText: totalQty > 20 ? "High Stock" : totalQty > 0 ? "Low Stock" : "Out of Stock",
            stockLocations: itemLocations,
            locations: itemLocations.map(l => ({ name: l.locationName, quantity: l.quantity })),
            lowStockThreshold,
            cost,
            value,
            technicalSpecs: {
                weightGrams: Math.floor(Math.random() * 500 + 50),
                dimensions: {
                    lengthCm: Math.floor(Math.random() * 30 + 5),
                    widthCm: Math.floor(Math.random() * 20 + 5),
                    heightCm: Math.floor(Math.random() * 20 + 5)
                },
                recommendedClawStrength: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)]
            },
            supplyChain: {
                vendor: "Mock Vendor Inc.",
                costPerUnit: cost,
                reorderPoint: lowStockThreshold
            },
            playWinTarget: Math.floor(Math.random() * 20 + 5),
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUpdateDate: new Date().toISOString()
        };

        items.push(item);
    }

    return items;
}
