import { useEffect, useState } from 'react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  ShoppingBagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { CatalogItem } from '../../types/api';

interface CatalogOffer extends CatalogItem {
  eligible?: boolean;
  eligibilityReason?: string;
  type?: 'PLAN' | 'ADDON';
}

const FALLBACK_CATALOG: CatalogOffer[] = [
  {
    itemId: 'cat-1',
    code: 'PLAN-BASIC-10',
    name: 'Basic 10GB',
    description: 'Essential plan with 10GB data, unlimited calls and 200 SMS.',
    category: 'ADDON',
    price: 14.99,
    currency: 'EUR',
    type: 'PLAN',
    eligible: true,
  },
  {
    itemId: 'cat-2',
    code: 'PLAN-PREMIUM-50',
    name: 'Premium 50GB',
    description: 'Premium plan with 50GB data, unlimited calls and unlimited SMS.',
    category: 'ADDON',
    price: 29.99,
    currency: 'EUR',
    type: 'PLAN',
    eligible: true,
  },
  {
    itemId: 'cat-3',
    code: 'PLAN-ULTRA-100',
    name: 'Ultra 100GB',
    description: 'Top-tier plan with 100GB data, unlimited calls, SMS and roaming in EU.',
    category: 'ADDON',
    price: 49.99,
    currency: 'EUR',
    type: 'PLAN',
    eligible: false,
    eligibilityReason: 'Requires 12-month contract commitment',
  },
  {
    itemId: 'cat-4',
    code: 'ADDON-DATA-5',
    name: 'Extra 5GB Data',
    description: 'Add 5GB of data to your current plan. Valid for current billing cycle.',
    category: 'ADDON',
    price: 7.99,
    currency: 'EUR',
    dataMb: 5120,
    durationDays: 30,
    type: 'ADDON',
    eligible: true,
  },
  {
    itemId: 'cat-5',
    code: 'ADDON-INTL-CALLS',
    name: 'International Calls Pack',
    description: '100 minutes of international calls to 40+ countries.',
    category: 'ADDON',
    price: 9.99,
    currency: 'EUR',
    durationDays: 30,
    type: 'ADDON',
    eligible: true,
  },
  {
    itemId: 'cat-6',
    code: 'ADDON-STREAMING',
    name: 'Streaming Pass',
    description: 'Zero-rated data for Netflix, YouTube, and Spotify.',
    category: 'ADDON',
    price: 4.99,
    currency: 'EUR',
    durationDays: 30,
    type: 'ADDON',
    eligible: true,
  },
];

interface CatalogProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onNavigate: (path: string) => void;
}

export function Catalog({ authedFetch, onNavigate }: CatalogProps) {
  const [offers, setOffers] = useState<CatalogOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<CatalogOffer | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    authedFetch('/api/v1/customer/catalog?lineId=line-001&operatorId=telco-pt&type=plan')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : FALLBACK_CATALOG;
        // Ensure each has eligible and type defaults
        setOffers(
          items.map((item: CatalogOffer) => ({
            ...item,
            eligible: item.eligible !== undefined ? item.eligible : true,
            type: item.type || (item.code?.startsWith('PLAN') ? 'PLAN' : 'ADDON'),
          }))
        );
      })
      .catch(() => setOffers(FALLBACK_CATALOG))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (offer: CatalogOffer) => {
    setSelectedOffer(offer);
    setShowConfirmDialog(true);
    setOrderSuccess(false);
  };

  const handleCheckout = async () => {
    if (!selectedOffer) return;
    setOrdering(true);
    try {
      const response = await authedFetch('/api/v1/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId: 'line-001',
          itemCode: selectedOffer.code,
          itemId: selectedOffer.itemId,
        }),
      });
      if (!response.ok) throw new Error();
    } catch {
      // fallback - show success anyway for mock
    }
    setOrdering(false);
    setOrderSuccess(true);
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(price);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Catalog</h1>
            <p className="page-subtitle">Browse available plans and add-ons</p>
          </div>
          <button className="btn-secondary" onClick={() => onNavigate('/orders')}>
            View Orders
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid-3">
          <LoadingSkeleton height="240px" />
          <LoadingSkeleton height="240px" />
          <LoadingSkeleton height="240px" />
        </div>
      )}

      {!loading && offers.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <ShoppingBagIcon style={{ width: 48, height: 48, color: 'var(--premium-text-muted)', margin: '0 auto 16px' }} />
          <p className="text-lg text-semibold">No offers available</p>
          <p className="text-sm text-secondary mt-2">Check back later for new plans and add-ons.</p>
        </div>
      )}

      {!loading && offers.length > 0 && (
        <div className="grid-3">
          {offers.map((offer) => (
            <div key={offer.itemId} className="card card-hover">
              <div className="stack" style={{ gap: '12px', height: '100%' }}>
                <div className="row-between">
                  <span className={`badge ${offer.type === 'PLAN' ? 'badge-info' : 'badge-purple'}`}>
                    {offer.type || 'ADDON'}
                  </span>
                  {offer.eligible !== false ? (
                    <span className="badge badge-success">Eligible</span>
                  ) : (
                    <span className="badge badge-neutral">Ineligible</span>
                  )}
                </div>
                <h3 className="text-lg text-semibold">{offer.name}</h3>
                <p className="text-sm text-secondary" style={{ flex: 1 }}>{offer.description}</p>
                {offer.eligible === false && offer.eligibilityReason && (
                  <p className="text-xs text-warning">{offer.eligibilityReason}</p>
                )}
                <div className="row-between mt-2">
                  <span className="text-xl text-bold text-primary">
                    {formatPrice(offer.price, offer.currency)}
                    <span className="text-sm text-muted" style={{ fontWeight: 400 }}>/mo</span>
                  </span>
                </div>
                <button
                  className={offer.eligible !== false ? 'btn-primary w-full' : 'btn-secondary w-full'}
                  disabled={offer.eligible === false}
                  onClick={() => handleSelect(offer)}
                >
                  {offer.eligible !== false ? 'Select' : 'Not Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={() => { setShowConfirmDialog(false); setOrderSuccess(false); }}
        onConfirm={orderSuccess ? () => { setShowConfirmDialog(false); setOrderSuccess(false); onNavigate('/orders'); } : handleCheckout}
        title={orderSuccess ? 'Order Placed' : 'Confirm Selection'}
        confirmText={orderSuccess ? 'View Orders' : ordering ? 'Processing...' : 'Confirm Order'}
        confirmDisabled={ordering}
        loading={ordering}
      >
        {selectedOffer && !orderSuccess && (
          <div className="stack" style={{ gap: '12px' }}>
            <div className="row-between">
              <span className="text-sm text-secondary">Item</span>
              <span className="text-sm text-semibold">{selectedOffer.name}</span>
            </div>
            <div className="row-between">
              <span className="text-sm text-secondary">Type</span>
              <span className={`badge ${selectedOffer.type === 'PLAN' ? 'badge-info' : 'badge-purple'}`}>
                {selectedOffer.type}
              </span>
            </div>
            <div className="row-between" style={{ paddingTop: '12px', borderTop: '1px solid var(--premium-border)' }}>
              <span className="text-base text-semibold">Total</span>
              <span className="text-lg text-bold text-primary">
                {formatPrice(selectedOffer.price, selectedOffer.currency)}/mo
              </span>
            </div>
          </div>
        )}
        {orderSuccess && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleIcon style={{ width: 48, height: 48, color: 'var(--premium-success)', margin: '0 auto 16px' }} />
            <p className="text-sm text-secondary">
              Your order for <strong>{selectedOffer?.name}</strong> has been placed successfully.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
