import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Badge, Card, Typography, Modal, Table, type TableColumn } from '../design-system';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled attribute', () => {
    render(<Button disabled>No</Button>);
    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled();
  });
});

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders with variant', () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});

describe('Typography', () => {
  it('renders heading element for h2 variant', () => {
    render(<Typography variant="h2">Title</Typography>);
    expect(screen.getByText('Title').tagName).toBe('H2');
  });

  it('renders p element for body variant', () => {
    render(<Typography variant="body">Text</Typography>);
    expect(screen.getByText('Text').tagName).toBe('P');
  });
});

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('adds role="button" when onClick is provided', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles Enter key when clickable', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('handles Space key when clickable', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={() => {}}>Hidden</Modal>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    render(<Modal open={true} onClose={() => {}}>Visible</Modal>);
    expect(screen.getByText('Visible')).toBeInTheDocument();
  });

  it('has aria-modal attribute', () => {
    render(<Modal open={true} onClose={() => {}} title="Test Modal">Content</Modal>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose}>Content</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking overlay', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose}>Content</Modal>);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Table', () => {
  interface Item { id: string; name: string; value: number; }
  const columns: TableColumn<Item>[] = [
    { key: 'name', header: 'Name' },
    { key: 'value', header: 'Value', render: (row) => <strong>{row.value}</strong> },
  ];
  const data: Item[] = [
    { id: '1', name: 'Alpha', value: 10 },
    { id: '2', name: 'Beta', value: 20 },
  ];

  it('renders column headers', () => {
    render(<Table columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<Table columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('renders custom render function', () => {
    render(<Table columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('10').tagName).toBe('STRONG');
  });

  it('renders select-all checkbox when selectable', () => {
    render(
      <Table
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        selectable
        selected={new Set()}
        onSelectChange={() => {}}
      />
    );
    expect(screen.getByLabelText('Select all rows')).toBeInTheDocument();
  });

  it('calls onSelectChange when row checkbox toggled', async () => {
    const onSelectChange = vi.fn();
    render(
      <Table
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        selectable
        selected={new Set()}
        onSelectChange={onSelectChange}
      />
    );
    await userEvent.click(screen.getByLabelText('Select row 1'));
    expect(onSelectChange).toHaveBeenCalledWith(new Set(['1']));
  });

  it('has role="grid" for accessibility', () => {
    render(<Table columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
