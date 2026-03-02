import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Nouveau</Badge>);
    expect(screen.getByText('Nouveau')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(<Badge>label</Badge>);
    expect(container.firstChild).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies secondary variant', () => {
    const { container } = render(<Badge variant="secondary">label</Badge>);
    expect(container.firstChild).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('applies destructive variant', () => {
    const { container } = render(<Badge variant="destructive">label</Badge>);
    expect(container.firstChild).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('applies outline variant', () => {
    const { container } = render(<Badge variant="outline">label</Badge>);
    expect(container.firstChild).toHaveClass('text-foreground');
    expect(container.firstChild).not.toHaveClass('bg-primary');
  });

  it('applies base shared classes', () => {
    const { container } = render(<Badge>label</Badge>);
    expect(container.firstChild).toHaveClass('inline-flex', 'items-center', 'rounded-md', 'text-xs', 'font-semibold');
  });

  it('forwards custom className', () => {
    const { container } = render(<Badge className="my-custom">label</Badge>);
    expect(container.firstChild).toHaveClass('my-custom');
  });
});
