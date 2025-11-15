import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../../components/atoms/EmptyState';

describe('EmptyState Component', () => {
    it('should render title', () => {
        render(<EmptyState title="No items found" />);
        expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
        render(
            <EmptyState
                title="No items"
                description="Try adding some items to get started"
            />
        );
        expect(screen.getByText('Try adding some items to get started')).toBeInTheDocument();
    });

    it('should render action button when provided', () => {
        const handleAction = jest.fn();
        render(
            <EmptyState
                title="No items"
                actionLabel="Add Item"
                onAction={handleAction}
            />
        );

        const button = screen.getByRole('button', { name: /add item/i });
        expect(button).toBeInTheDocument();
    });

    it('should not render action button when not provided', () => {
        render(<EmptyState title="No items" />);
        const button = screen.queryByRole('button');
        expect(button).not.toBeInTheDocument();
    });

    it('should render default icon for empty variant', () => {
        const { container } = render(<EmptyState title="No items" variant="empty" />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
    });
});
