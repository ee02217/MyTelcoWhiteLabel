import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, Panel, Typography } from '../../design-system';
import { fetchContentDetail, patchContent, postContentRollback } from '../../services/api-client';
import { styles } from '../../shared-styles';
import type { ContentState, ContentSummaryResponse } from '../../types';

type Props = {
  operatorId: string;
  contentItems: ContentSummaryResponse[];
  preferredLocales: string[];
  onError: (message: string) => void;
  onStatus: (message: string) => void;
  onDataChanged: () => void;
};

const contentStateBadgeVariant = (state: ContentState) => {
  switch (state) {
    case 'PUBLISHED': return 'success';
    case 'REVIEW': return 'info';
    case 'DRAFT': default: return 'warning';
  }
};

export function ContentPanel({ operatorId, contentItems, preferredLocales, onError, onStatus, onDataChanged }: Props) {
  const [selectedContentId, setSelectedContentId] = useState('');
  const [selectedContentLocale, setSelectedContentLocale] = useState('');
  const queryClient = useQueryClient();

  const [contentTitleDraft, setContentTitleDraft] = useState('');
  const [contentBodyDraft, setContentBodyDraft] = useState('');
  const [contentNotesDraft, setContentNotesDraft] = useState('');
  const [contentStateDraft, setContentStateDraft] = useState<ContentState>('DRAFT');
  const [contentReviewerDraft, setContentReviewerDraft] = useState('');

  // Auto-select first content item
  useEffect(() => {
    if (contentItems.length > 0 && !contentItems.some((item) => item.contentId === selectedContentId)) {
      const first = contentItems[0];
      setSelectedContentId(first.contentId);
      const locales = first.locales.map((e) => e.locale);
      const preferred = preferredLocales.find((l) => locales.includes(l));
      setSelectedContentLocale(preferred || locales[0] || '');
    }
  }, [contentItems]);

  const { data: contentDetail } = useQuery({
    queryKey: ['content', operatorId, selectedContentId, selectedContentLocale],
    queryFn: () => fetchContentDetail(operatorId, selectedContentId, selectedContentLocale),
    enabled: !!operatorId && !!selectedContentId && !!selectedContentLocale,
  });

  // Sync drafts when detail loads
  useEffect(() => {
    if (!contentDetail) return;
    setContentTitleDraft(contentDetail.current.title);
    setContentBodyDraft(contentDetail.current.body);
    setContentNotesDraft(contentDetail.current.notes || '');
    setContentStateDraft(contentDetail.current.state);
    setContentReviewerDraft(contentDetail.current.reviewer || '');
  }, [contentDetail]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['content', operatorId] });
    onDataChanged();
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      patchContent(operatorId, selectedContentId, {
        locale: selectedContentLocale,
        title: contentTitleDraft.trim(),
        body: contentBodyDraft.trim(),
        notes: contentNotesDraft.trim() || null,
        state: contentStateDraft,
        reviewer: contentReviewerDraft.trim() || null,
      }),
    onSuccess: (payload) => {
      onStatus(`Content ${payload.contentId}/${payload.locale} saved (v${payload.version} ${payload.state})`);
      invalidate();
    },
    onError: (err) => onError(String(err)),
  });

  const rollbackMutation = useMutation({
    mutationFn: (targetVersion: number) =>
      postContentRollback(operatorId, selectedContentId, {
        locale: selectedContentLocale,
        version: targetVersion,
      }),
    onSuccess: (payload) => {
      onStatus(`Rolled back ${payload.contentId}/${payload.locale} (new v${payload.version})`);
      invalidate();
    },
    onError: (err) => onError(String(err)),
  });

  return (
    <Panel title="Content (CMS)" subtitle="Manage localized content versions and rollback">
      {contentItems.length === 0 && (
        <Typography variant="small">No content items yet.</Typography>
      )}
      {contentItems.map((item) => (
        <div key={item.contentId} style={{ marginBottom: 6 }}>
          <Button
            size="sm"
            variant={selectedContentId === item.contentId ? 'primary' : 'outline'}
            onClick={() => {
              setSelectedContentId(item.contentId);
              const locales = item.locales.map((e) => e.locale);
              const preferred = preferredLocales.find((l) => locales.includes(l));
              setSelectedContentLocale(preferred || locales[0] || '');
            }}
          >
            {item.contentId}
          </Button>
          <span style={{ marginLeft: 6, fontSize: 12 }}>
            {item.locales.map((l) => (
              <Badge key={l.locale} variant="neutral" style={{ marginRight: 4 }}>
                {l.locale}:v{l.version} {l.state}
              </Badge>
            ))}
          </span>
        </div>
      ))}

      {contentDetail && selectedContentLocale && (
        <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
          <div style={styles.row}>
            <Field label="Locale">
              <select
                style={styles.input}
                value={selectedContentLocale}
                onChange={(e) => setSelectedContentLocale(e.target.value)}
              >
                {contentDetail.history
                  .map((v) => v.locale)
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
              </select>
            </Field>
            <Badge variant={contentStateBadgeVariant(contentDetail.current.state)}>
              {contentDetail.current.state}
            </Badge>
            <Typography variant="caption" color="secondary">
              v{contentDetail.current.version} by {contentDetail.current.author}
            </Typography>
          </div>

          <Field label="Title">
            <input
              style={{ ...styles.input, width: '100%' }}
              value={contentTitleDraft}
              onChange={(e) => setContentTitleDraft(e.target.value)}
            />
          </Field>

          <Field label="Body (markdown)">
            <textarea
              style={{ ...styles.input, width: '100%', minHeight: 120, fontFamily: 'monospace', resize: 'vertical' }}
              value={contentBodyDraft}
              onChange={(e) => setContentBodyDraft(e.target.value)}
            />
          </Field>

          <Field label="Notes (optional)">
            <input
              style={{ ...styles.input, width: '100%' }}
              value={contentNotesDraft}
              onChange={(e) => setContentNotesDraft(e.target.value)}
            />
          </Field>

          <Field label="State">
            <div style={styles.row}>
              {(['DRAFT', 'REVIEW', 'PUBLISHED'] as ContentState[]).map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={contentStateDraft === st ? 'primary' : 'outline'}
                  onClick={() => setContentStateDraft(st)}
                >
                  {st}
                </Button>
              ))}
            </div>
          </Field>

          <Field label="Reviewer (optional)">
            <input
              style={styles.input}
              value={contentReviewerDraft}
              onChange={(e) => setContentReviewerDraft(e.target.value)}
            />
          </Field>

          <div style={styles.row}>
            <Button size="sm" onClick={() => saveMutation.mutate()}>
              Save content
            </Button>
            {contentDetail.history.length > 1 && (
              <select
                style={styles.input}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) rollbackMutation.mutate(Number(v));
                }}
              >
                <option value="">Rollback to...</option>
                {contentDetail.history
                  .filter((h) => h.version !== contentDetail.current.version)
                  .map((h) => (
                    <option key={h.version} value={h.version}>
                      v{h.version} ({h.state})
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
