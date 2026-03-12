import { useMemo, useState } from 'react';
import { Button, Card, Typography } from '../../design-system';

type Offer = {
  offerId: string;
  name: string;
  type: 'PLAN' | 'ADDON';
  eligible: boolean;
  eligibilityReason: string;
  pricing: { amount: number; currency: string };
  effectiveDate: string;
  terms: { summary: string; reference: string };
};

type CatalogResponse = { lineId: string; operatorId: string; offers: Offer[] };
type ConfirmResponse = {
  totalPrice: { amount: number; currency: string };
  termsAcknowledgement: { accepted: boolean; reference: string };
};

export function CatalogPanel({
  authedFetch,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const [lineId, setLineId] = useState('line-22');
  const [operatorId, setOperatorId] = useState('vodafone-pt');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState('Catalog not loaded yet');
  const [confirmation, setConfirmation] = useState<ConfirmResponse | null>(null);

  const totalPreview = useMemo(
    () =>
      offers
        .filter((o) => selectedIds.includes(o.offerId))
        .reduce((acc, curr) => acc + curr.pricing.amount, 0),
    [offers, selectedIds]
  );

  const loadCatalog = async () => {
    const response = await authedFetch(
      `/api/v1/customer/catalog?lineId=${lineId}&operatorId=${operatorId}`
    );
    const payload = (await response.json()) as CatalogResponse;
    setOffers(payload.offers);
    setSelectedIds([]);
    setConfirmation(null);
    setStatus(`Loaded ${payload.offers.length} offers for ${payload.operatorId}/${payload.lineId}`);
  };

  const toggleSelection = (offerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(offerId) ? prev.filter((id) => id !== offerId) : [...prev, offerId]
    );
  };

  const confirmSelection = async () => {
    const response = await authedFetch('/api/v1/customer/catalog/confirm-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineId,
        operatorId,
        selectedOfferIds: selectedIds,
        termsAccepted: true,
        termsReference: 'terms://catalog/confirm',
      }),
    });
    setConfirmation((await response.json()) as ConfirmResponse);
  };

  return (
    <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
      <Typography variant="h4">Plan/Add-on catalog (Issue #37)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="lineId" />
        <input
          value={operatorId}
          onChange={(e) => setOperatorId(e.target.value)}
          placeholder="operatorId"
        />
        <Button
          size="sm"
          onClick={() => loadCatalog().catch(() => setStatus('Catalog load failed'))}
        >
          Load catalog
        </Button>
      </div>

      {offers.map((offer) => (
        <div
          key={offer.offerId}
          style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 10 }}
        >
          <Typography variant="body">
            {offer.name} ({offer.type})
          </Typography>
          <Typography variant="small" color="secondary">
            Eligibility: {offer.eligible ? 'Eligible' : `Ineligible (${offer.eligibilityReason})`}
          </Typography>
          <Typography variant="small" color="secondary">
            Price: {offer.pricing.currency} {offer.pricing.amount.toFixed(2)} | Effective:{' '}
            {offer.effectiveDate}
          </Typography>
          <Typography variant="small" color="secondary">
            Terms: {offer.terms.summary}
          </Typography>
          <Button
            size="sm"
            disabled={!offer.eligible}
            onClick={() => toggleSelection(offer.offerId)}
          >
            {selectedIds.includes(offer.offerId) ? 'Remove' : 'Select'}
          </Button>
        </div>
      ))}

      <Typography variant="body" style={{ marginTop: 10 }}>
        Confirmation preview total: EUR {totalPreview.toFixed(2)}
      </Typography>
      <Button
        size="sm"
        onClick={() => confirmSelection().catch(() => setStatus('Confirmation failed'))}
        disabled={selectedIds.length === 0}
      >
        Confirm selection with terms
      </Button>
      {confirmation && (
        <Typography variant="small" color="secondary" style={{ marginTop: 8 }}>
          Confirmed total: {confirmation.totalPrice.currency}{' '}
          {confirmation.totalPrice.amount.toFixed(2)} | Terms:{' '}
          {confirmation.termsAcknowledgement.reference}
        </Typography>
      )}
    </Card>
  );
}
