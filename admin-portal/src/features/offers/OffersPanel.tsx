import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, Panel, Typography } from '../../design-system';
import { fetchOfferDetail, patchOffer } from '../../services/api-client';
import { styles } from '../../shared-styles';
import type { OfferState, OfferSummaryResponse } from '../../types';

type Props = {
  operatorId: string;
  offers: OfferSummaryResponse[];
  onError: (message: string) => void;
  onStatus: (message: string) => void;
  onDataChanged: () => void;
};

const offerStateBadgeVariant = (state: OfferState) => {
  switch (state) {
    case 'PUBLISHED': return 'success';
    case 'APPROVAL': return 'info';
    case 'RETIRED': return 'neutral';
    case 'DRAFT': default: return 'warning';
  }
};

export function OffersPanel({ operatorId, offers, onError, onStatus, onDataChanged }: Props) {
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [newOfferIdDraft, setNewOfferIdDraft] = useState('');
  const queryClient = useQueryClient();

  const [offerNameDraft, setOfferNameDraft] = useState('');
  const [offerDescriptionDraft, setOfferDescriptionDraft] = useState('');
  const [offerChannelsDraft, setOfferChannelsDraft] = useState('');
  const [offerEligibilityDraft, setOfferEligibilityDraft] = useState('{}');
  const [offerStateDraft, setOfferStateDraft] = useState<OfferState>('DRAFT');
  const [offerNotesDraft, setOfferNotesDraft] = useState('');
  const [offerReviewerDraft, setOfferReviewerDraft] = useState('');

  // Auto-select first offer
  useEffect(() => {
    if (offers.length > 0 && !offers.some((o) => o.offerId === selectedOfferId)) {
      setSelectedOfferId(offers[0].offerId);
    }
    setNewOfferIdDraft('');
  }, [offers]);

  const { data: offerDetail } = useQuery({
    queryKey: ['offers', operatorId, selectedOfferId],
    queryFn: () => fetchOfferDetail(operatorId, selectedOfferId),
    enabled: !!operatorId && !!selectedOfferId,
    retry: (failureCount, error) => {
      // Don't retry 404s (new offer that doesn't exist yet)
      if (error instanceof Error && error.message.startsWith('404')) return false;
      return failureCount < 1;
    },
  });

  // Sync drafts when detail loads
  useEffect(() => {
    if (!offerDetail) return;
    setOfferNameDraft(offerDetail.current.name);
    setOfferDescriptionDraft(offerDetail.current.description);
    setOfferChannelsDraft(offerDetail.current.visibleChannels.join(', '));
    setOfferEligibilityDraft(JSON.stringify(offerDetail.current.eligibilityRules || {}, null, 2));
    setOfferStateDraft(offerDetail.current.state);
    setOfferNotesDraft(offerDetail.current.notes || '');
    setOfferReviewerDraft(offerDetail.current.reviewer || '');
  }, [offerDetail]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['offers', operatorId] });
    onDataChanged();
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const channels = offerChannelsDraft
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      let eligibilityRules: Record<string, unknown>;
      try {
        eligibilityRules = JSON.parse(offerEligibilityDraft || '{}') as Record<string, unknown>;
      } catch (err) {
        throw new Error(`Eligibility rules must be valid JSON: ${String(err)}`);
      }

      return patchOffer(operatorId, selectedOfferId, {
        name: offerNameDraft.trim(),
        description: offerDescriptionDraft.trim(),
        eligibilityRules,
        visibleChannels: channels,
        state: offerStateDraft,
        notes: offerNotesDraft.trim() || null,
        reviewer: offerReviewerDraft.trim() || null,
      });
    },
    onSuccess: (payload) => {
      onStatus(`Offer ${payload.offerId} saved (v${payload.version} ${payload.state})`);
      invalidate();
    },
    onError: (err) => onError(String(err)),
  });

  const startNewOffer = () => {
    const candidate = newOfferIdDraft.trim().toLowerCase();
    if (!candidate) {
      onError('Offer ID is required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(candidate)) {
      onError('Offer ID must be kebab-case (lowercase, numbers, hyphen)');
      return;
    }
    setSelectedOfferId(candidate);
    setOfferNameDraft('');
    setOfferDescriptionDraft('');
    setOfferChannelsDraft('');
    setOfferEligibilityDraft('{}');
    setOfferStateDraft('DRAFT');
    setOfferNotesDraft('');
    setOfferReviewerDraft('');
    setNewOfferIdDraft('');
    onStatus(`Preparing new offer ${candidate}`);
  };

  return (
    <Panel title="Offers" subtitle="Offer lifecycle: draft, approval, publish, retire">
      {offers.length === 0 && (
        <Typography variant="small">No offers configured for this operator.</Typography>
      )}
      {offers.map((offer) => (
        <div key={offer.offerId} style={{ marginBottom: 6 }}>
          <div style={styles.row}>
            <Button
              size="sm"
              variant={selectedOfferId === offer.offerId ? 'primary' : 'outline'}
              onClick={() => {
                setSelectedOfferId(offer.offerId);
                setNewOfferIdDraft('');
              }}
            >
              {offer.name} ({offer.offerId})
            </Button>
            <Badge variant={offerStateBadgeVariant(offer.state)}>{offer.state}</Badge>
            <Badge variant="neutral">v{offer.version}</Badge>
          </div>
          <Typography variant="caption" color="secondary">
            Channels: {offer.visibleChannels.join(', ') || 'n/a'} · Updated {offer.updatedAt}
          </Typography>
        </div>
      ))}
      <Field label="Start new offer (kebab-case)">
        <div style={styles.row}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="plan-new-catalog-offer"
            value={newOfferIdDraft}
            onChange={(event) => setNewOfferIdDraft(event.target.value)}
          />
          <Button size="sm" variant="outline" onClick={startNewOffer}>
            Start new offer
          </Button>
        </div>
      </Field>
      {offerDetail ? (
        <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
          <div style={styles.row}>
            <Badge variant={offerStateBadgeVariant(offerDetail.current.state)}>
              {offerDetail.current.state}
            </Badge>
            <Badge variant="neutral">v{offerDetail.current.version}</Badge>
            <Typography variant="caption" color="secondary">
              {offerDetail.current.author} · Updated {offerDetail.current.updatedAt}
            </Typography>
          </div>
          <Field label="Name">
            <input
              style={{ ...styles.input, width: '100%' }}
              value={offerNameDraft}
              onChange={(event) => setOfferNameDraft(event.target.value)}
            />
          </Field>
          <Field label="Description">
            <textarea
              style={{ ...styles.input, width: '100%', minHeight: 80, resize: 'vertical' }}
              value={offerDescriptionDraft}
              onChange={(event) => setOfferDescriptionDraft(event.target.value)}
            />
          </Field>
          <Field label="Visible channels (comma separated)">
            <input
              style={styles.input}
              value={offerChannelsDraft}
              onChange={(event) => setOfferChannelsDraft(event.target.value)}
            />
          </Field>
          <Field label="Eligibility rules (JSON)">
            <textarea
              style={{ ...styles.input, width: '100%', minHeight: 120, fontFamily: 'monospace', resize: 'vertical' }}
              value={offerEligibilityDraft}
              onChange={(event) => setOfferEligibilityDraft(event.target.value)}
            />
          </Field>
          <Field label="State">
            <div style={styles.row}>
              {(['DRAFT', 'APPROVAL', 'PUBLISHED', 'RETIRED'] as OfferState[]).map((state) => (
                <Button
                  key={state}
                  size="sm"
                  variant={offerStateDraft === state ? 'primary' : 'outline'}
                  onClick={() => setOfferStateDraft(state)}
                >
                  {state}
                </Button>
              ))}
            </div>
          </Field>
          <Field label="Notes (optional)">
            <input
              style={styles.input}
              value={offerNotesDraft}
              onChange={(event) => setOfferNotesDraft(event.target.value)}
            />
          </Field>
          <Field label="Reviewer (optional)">
            <input
              style={styles.input}
              value={offerReviewerDraft}
              onChange={(event) => setOfferReviewerDraft(event.target.value)}
            />
          </Field>
          <div style={styles.row}>
            <Button size="sm" onClick={() => saveMutation.mutate()}>
              Save offer
            </Button>
          </div>
          {offerDetail.history.length > 1 && (
            <div style={{ marginTop: 12 }}>
              <Typography variant="small">History</Typography>
              {offerDetail.history.map((entry) => (
                <div key={`${entry.offerId}-${entry.version}`} style={styles.row}>
                  <Badge variant={offerStateBadgeVariant(entry.state)}>{entry.state}</Badge>
                  <Badge variant="neutral">v{entry.version}</Badge>
                  <Typography variant="caption" color="secondary">
                    {entry.updatedAt} · {entry.author}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {entry.notes || entry.description}
                  </Typography>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Typography variant="small">
          Select or start an offer to edit its lifecycle.
        </Typography>
      )}
    </Panel>
  );
}
