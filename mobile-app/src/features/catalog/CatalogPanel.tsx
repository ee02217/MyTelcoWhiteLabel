import { useMemo, useState } from 'react';
import { View } from 'react-native';
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

type CatalogResponse = { offers: Offer[] };
type ConfirmResponse = {
  totalPrice: { amount: number; currency: string };
  termsAcknowledgement: { reference: string };
};

export function CatalogPanel({
  authedFetch,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState('Catalog not loaded');
  const [confirm, setConfirm] = useState<ConfirmResponse | null>(null);

  const totalPreview = useMemo(
    () =>
      offers
        .filter((o) => selected.includes(o.offerId))
        .reduce((acc, c) => acc + c.pricing.amount, 0),
    [offers, selected]
  );

  const loadCatalog = async () => {
    const response = await authedFetch(
      '/api/v1/customer/catalog?lineId=line-22&operatorId=vodafone-pt'
    );
    const payload = (await response.json()) as CatalogResponse;
    setOffers(payload.offers);
    setStatus(`Loaded ${payload.offers.length} offers`);
    setSelected([]);
    setConfirm(null);
  };

  const confirmSelection = async () => {
    const response = await authedFetch('/api/v1/customer/catalog/confirm-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineId: 'line-22',
        operatorId: 'vodafone-pt',
        selectedOfferIds: selected,
        termsAccepted: true,
        termsReference: 'terms://catalog/confirm',
      }),
    });
    setConfirm((await response.json()) as ConfirmResponse);
  };

  return (
    <Card padding="md" shadow="md">
      <Typography variant="h4">Plan/Add-on catalog (Issue #37)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>
      <Button
        title="Load catalog (line-22)"
        onPress={() => loadCatalog().catch(() => setStatus('Catalog load failed'))}
      />

      {offers.map((offer) => (
        <View key={offer.offerId} style={{ marginTop: 8 }}>
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
            title={selected.includes(offer.offerId) ? 'Remove selection' : 'Select offer'}
            onPress={() =>
              setSelected((prev) =>
                prev.includes(offer.offerId)
                  ? prev.filter((id) => id !== offer.offerId)
                  : [...prev, offer.offerId]
              )
            }
            disabled={!offer.eligible}
          />
        </View>
      ))}

      <Typography variant="body">
        Confirmation preview total: EUR {totalPreview.toFixed(2)}
      </Typography>
      <Button
        title="Confirm with terms"
        onPress={() => confirmSelection().catch(() => setStatus('Confirmation failed'))}
        disabled={selected.length === 0}
      />
      {confirm && (
        <Typography variant="small" color="secondary">
          Confirmed total: {confirm.totalPrice.currency} {confirm.totalPrice.amount.toFixed(2)} |
          Terms: {confirm.termsAcknowledgement.reference}
        </Typography>
      )}
    </Card>
  );
}
