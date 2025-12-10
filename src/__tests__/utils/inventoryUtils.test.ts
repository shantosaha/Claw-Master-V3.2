import { calculateStockLevel } from '@/utils/inventoryUtils';

describe('calculateStockLevel', () => {
    it('returns Out of Stock when quantity is 0', () => {
        const result = calculateStockLevel(0);
        expect(result.label).toBe('Out of Stock');
        expect(result.colorClass).toContain('red');
    });

    it('returns Low Stock for quantities between 1-11', () => {
        const result = calculateStockLevel(5);
        expect(result.label).toBe('Low Stock');
        expect(result.colorClass).toContain('orange');
    });

    it('returns Limited Stock for quantities between 12-25', () => {
        const result = calculateStockLevel(20);
        expect(result.label).toBe('Limited Stock');
        expect(result.colorClass).toContain('amber');
    });

    it('returns In Stock for quantities above 25', () => {
        const result = calculateStockLevel(50);
        expect(result.label).toBe('In Stock');
        expect(result.colorClass).toContain('emerald');
    });

    it('respects override status', () => {
        // Even with high quantity, if status is overridden to "Low Stock"
        const result = calculateStockLevel(50, 'Low Stock');
        expect(result.label).toBe('Low Stock');
    });

    it('handles negative quantity', () => {
        const result = calculateStockLevel(-5);
        expect(result.label).toBe('Out of Stock');
    });

    it('returns correct status object structure', () => {
        const result = calculateStockLevel(30);
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('label');
        expect(result).toHaveProperty('colorClass');
    });
});
