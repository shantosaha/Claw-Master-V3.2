import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, NoItemsFound, ErrorState } from '@/components/common/EmptyState';

describe('EmptyState', () => {
    it('renders with title and description', () => {
        render(
            <EmptyState
                title="No items"
                description="Add your first item to get started"
            />
        );

        expect(screen.getByText('No items')).toBeInTheDocument();
        expect(screen.getByText('Add your first item to get started')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
        const handleClick = jest.fn();
        render(
            <EmptyState
                title="No items"
                action={{
                    label: 'Add Item',
                    onClick: handleClick,
                }}
            />
        );

        const button = screen.getByText('Add Item');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders with destructive variant', () => {
        render(
            <EmptyState
                title="Error occurred"
                variant="destructive"
            />
        );

        expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
});

describe('NoItemsFound', () => {
    it('renders default message', () => {
        render(<NoItemsFound />);

        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.getByText(/no items matching your criteria/i)).toBeInTheDocument();
    });

    it('renders with custom item type', () => {
        render(<NoItemsFound itemType="machines" />);

        expect(screen.getByText('No machines found')).toBeInTheDocument();
    });

    it('renders add button when onAdd is provided', () => {
        const handleAdd = jest.fn();
        render(<NoItemsFound onAdd={handleAdd} />);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(handleAdd).toHaveBeenCalled();
    });
});

describe('ErrorState', () => {
    it('renders default error message', () => {
        render(<ErrorState />);

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders custom error message', () => {
        render(<ErrorState error="Network connection failed" />);

        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
        const handleRetry = jest.fn();
        render(<ErrorState onRetry={handleRetry} />);

        const button = screen.getByText('Try again');
        fireEvent.click(button);
        expect(handleRetry).toHaveBeenCalled();
    });
});
