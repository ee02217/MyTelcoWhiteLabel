import { useEffect, useState } from 'react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  ShoppingCartIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import type { Order } from '../../types/api';

const FALLBACK_ORDERS: Order[] = [
  {
    orderId: 'ord-001',
    itemCode: 'ADDON-DATA-5',
    itemName: 'Extra 5GB Data',
    state: 'COMPLETED',
    createdAt: '2026-03-18T10:30:00Z',
    updatedAt: '2026-03-18T10:35:00Z',
    amount: 7.99,
    currency: 'EUR',
    rollbackApplied: false,
  },
  {
    orderId: 'ord-002',
    itemCode: 'PLAN-PREMIUM-50',
    itemName: 'Premium 50GB',
    state: 'PROCESSING',
    createdAt: '2026-03-22T14:00:00Z',
    updatedAt: '2026-03-22T14:00:00Z',
    amount: 29.99,
    currency: 'EUR',
    rollbackApplied: false,
  },
  {
    orderId: 'ord-003',
    itemCode: 'ADDON-INTL-CALLS',
    itemName: 'International Calls Pack',
    state: 'PENDING',
    createdAt: '2026-03-23T08:15:00Z',
    updatedAt: '2026-03-23T08:15:00Z',
    amount: 9.99,
    currency: 'EUR',
    rollbackApplied: false,
  },
  {
    orderId: 'ord-004',
    itemCode: 'ADDON-STREAMING',
    itemName: 'Streaming Pass',
    state: 'FAILED',
    createdAt: '2026-03-15T16:00:00Z',
    updatedAt: '2026-03-15T16:05:00Z',
    amount: 4.99,
    currency: 'EUR',
    rollbackApplied: true,
  },
];

const STATUS_BADGES: Record<string, string> = {
  PENDING: 'badge-warning',
  PROCESSING: 'badge-info',
  COMPLETED: 'badge-success',
  FAILED: 'badge-error',
  ROLLED_BACK: 'badge-neutral',
};

interface OrdersProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onNavigate: (path: string) => void;
}

export function Orders({ authedFetch, onNavigate }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    authedFetch('/api/v1/customer/orders?lineId=line-001')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setOrders(Array.isArray(data) ? data : FALLBACK_ORDERS))
      .catch(() => setOrders(FALLBACK_ORDERS))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amount);

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Orders</h1>
            <p className="page-subtitle">Track your plan changes and add-on purchases</p>
          </div>
          <button className="btn-primary" onClick={() => onNavigate('/catalog')}>
            Browse Catalog
          </button>
        </div>
      </div>

      {loading && (
        <div className="stack-gap">
          <LoadingSkeleton height="80px" />
          <LoadingSkeleton height="80px" />
          <LoadingSkeleton height="80px" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <ShoppingCartIcon style={{ width: 48, height: 48, color: 'var(--premium-text-muted)', margin: '0 auto 16px' }} />
          <p className="text-lg text-semibold">No orders yet</p>
          <p className="text-sm text-secondary mt-2">
            Browse our catalog to find plans and add-ons.
          </p>
          <button className="btn-primary mt-4" onClick={() => onNavigate('/catalog')}>
            Browse Catalog
          </button>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="stack-gap">
          {orders.map((order) => (
            <div key={order.orderId} className="card">
              <div
                className="row-between"
                style={{ cursor: 'pointer', flexWrap: 'wrap', gap: '12px' }}
                onClick={() => toggleExpand(order.orderId)}
              >
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: '8px', marginBottom: '4px' }}>
                    <h3 className="text-base text-semibold">{order.itemName}</h3>
                    <span className={`badge ${STATUS_BADGES[order.state]}`}>
                      {order.state}
                    </span>
                  </div>
                  <p className="text-sm text-secondary">
                    Order {order.orderId} &middot; {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="row" style={{ gap: '12px' }}>
                  <span className="text-base text-semibold">
                    {formatPrice(order.amount, order.currency)}
                  </span>
                  {expandedOrder === order.orderId ? (
                    <ChevronUpIcon style={{ width: 20, height: 20, color: 'var(--premium-text-muted)' }} />
                  ) : (
                    <ChevronDownIcon style={{ width: 20, height: 20, color: 'var(--premium-text-muted)' }} />
                  )}
                </div>
              </div>

              {expandedOrder === order.orderId && (
                <div className="mt-4" style={{ paddingTop: '16px', borderTop: '1px solid var(--premium-border)' }}>
                  <div className="detail-list">
                    <div className="detail-row">
                      <span className="detail-label">Order ID</span>
                      <span className="detail-value" style={{ fontFamily: 'monospace' }}>{order.orderId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Item Code</span>
                      <span className="detail-value">{order.itemCode}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status</span>
                      <span className={`badge ${STATUS_BADGES[order.state]}`}>{order.state}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created</span>
                      <span className="detail-value">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Last Updated</span>
                      <span className="detail-value">{formatDate(order.updatedAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value text-semibold">{formatPrice(order.amount, order.currency)}</span>
                    </div>
                    {order.rollbackApplied && (
                      <div className="detail-row">
                        <span className="detail-label">Rollback</span>
                        <span className="detail-value badge badge-warning">Applied</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
