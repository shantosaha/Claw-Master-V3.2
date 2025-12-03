export async function generateStockItemNote({ itemName, itemCategory, existingNote }: { itemName: string, itemCategory: string, existingNote?: string }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
        generatedNote: `This is a high-quality ${itemName} belonging to the ${itemCategory} category. It is a popular item among players and features vibrant colors and durable materials. Perfect for claw machines of all sizes.`
    };
}
