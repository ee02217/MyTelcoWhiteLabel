import { useState } from 'react';
import { Button, Card, Typography } from '../../design-system';

type SupportCaseAttachment = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url?: string;
};

type SupportCaseTimelineEntry = {
  entryId: string;
  timestamp: string;
  actor: string;
  actorType: string;
  type: string;
  message: string;
};

type SupportCase = {
  caseId: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  slaTarget: string;
  expectedResponseAt: string;
  attachments: SupportCaseAttachment[];
  timeline: SupportCaseTimelineEntry[];
};

export function SupportCasesPanel({
  authedFetch,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selected, setSelected] = useState<SupportCase | null>(null);
  const [status, setStatus] = useState('Support cases idle');

  const createCase = async () => {
    const response = await authedFetch('/api/v1/customer/support/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'TECHNICAL',
        subject: 'Intermittent mobile data',
        description: 'Data drops every 15 minutes in downtown area.',
        priority: 'HIGH',
        attachments: [
          {
            fileName: 'signal-screenshot.png',
            contentType: 'image/png',
            sizeBytes: 48123,
            url: 'https://cdn.example/signal-screenshot.png',
          },
        ],
      }),
    });

    const payload = (await response.json()) as SupportCase;
    setStatus(`Case created: ${payload.caseId}`);
    await loadCases();
    await loadCase(payload.caseId);
  };

  const loadCases = async () => {
    const response = await authedFetch('/api/v1/customer/support/cases');
    const payload = (await response.json()) as SupportCase[];
    setCases(payload);
    setStatus(`Loaded ${payload.length} support cases`);
  };

  const loadCase = async (caseId: string) => {
    const response = await authedFetch(`/api/v1/customer/support/cases/${caseId}`);
    const payload = (await response.json()) as SupportCase;
    setSelected(payload);
  };

  const addMessage = async () => {
    if (!selected) return;
    const response = await authedFetch(
      `/api/v1/customer/support/cases/${selected.caseId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'web-customer',
          actorType: 'CUSTOMER',
          message: 'Any update on the incident?',
        }),
      }
    );
    const payload = (await response.json()) as SupportCase;
    setSelected(payload);
    setStatus(`Timeline updated for ${payload.caseId}`);
    await loadCases();
  };

  return (
    <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
      <Typography variant="h4">Support case management (Issue #41)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <Button
          size="sm"
          onClick={() => createCase().catch(() => setStatus('Case creation failed'))}
        >
          Create support case
        </Button>
        <Button
          size="sm"
          onClick={() => loadCases().catch(() => setStatus('Failed loading cases'))}
        >
          Refresh case list
        </Button>
        <Button
          size="sm"
          onClick={() => addMessage().catch(() => setStatus('Failed updating timeline'))}
          disabled={!selected}
        >
          Add timeline message
        </Button>
      </div>

      {cases.slice(0, 5).map((item) => (
        <div key={item.caseId} style={{ marginTop: 10 }}>
          <Button
            size="sm"
            onClick={() =>
              loadCase(item.caseId).catch(() => setStatus('Failed loading case detail'))
            }
          >
            View {item.caseId}
          </Button>
          <Typography variant="small" color="secondary">
            {item.category} · {item.status} · {item.slaTarget}
          </Typography>
        </div>
      ))}

      {selected && (
        <div style={{ marginTop: 12 }}>
          <Typography variant="body">Subject: {selected.subject}</Typography>
          <Typography variant="small" color="secondary">
            Expected response: {new Date(selected.expectedResponseAt).toLocaleString()}
          </Typography>
          <Typography variant="small" color="secondary">
            Attachments: {selected.attachments.map((att) => att.fileName).join(', ') || 'none'}
          </Typography>
          {selected.timeline.map((entry) => (
            <Typography
              key={entry.entryId}
              variant="small"
              color="secondary"
              style={{ marginTop: 6 }}
            >
              {new Date(entry.timestamp).toLocaleString()} · {entry.actorType}({entry.actor}) ·{' '}
              {entry.message}
            </Typography>
          ))}
        </div>
      )}
    </Card>
  );
}
