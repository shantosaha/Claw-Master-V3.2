import { render, screen } from '@testing-library/react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

describe('LoadingSkeleton', () => {
    it('renders card variant by default', () => {
        const { container } = render(<LoadingSkeleton />);

        // Should render skeleton elements
        expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('renders multiple items when count is specified', () => {
        const { container } = render(<LoadingSkeleton count={3} />);

        // Should have 3 card items
        const cards = container.querySelectorAll('.border.rounded-lg');
        expect(cards.length).toBe(3);
    });

    it('renders table variant', () => {
        const { container } = render(<LoadingSkeleton variant="table" count={5} />);

        // Should have table-like structure with rows
        const rows = container.querySelectorAll('.flex.gap-4');
        expect(rows.length).toBeGreaterThan(0);
    });

    it('renders list variant', () => {
        const { container } = render(<LoadingSkeleton variant="list" count={3} />);

        // Should have list items
        const listItems = container.querySelectorAll('.flex.items-center');
        expect(listItems.length).toBe(3);
    });

    it('renders detail variant', () => {
        const { container } = render(<LoadingSkeleton variant="detail" />);

        // Should have detail layout structure
        expect(container.querySelector('.space-y-6')).toBeInTheDocument();
    });

    it('renders stats variant', () => {
        const { container } = render(<LoadingSkeleton variant="stats" count={4} />);

        // Should have stats grid
        expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<LoadingSkeleton className="custom-class" />);

        expect(container.firstChild).toHaveClass('custom-class');
    });
});
