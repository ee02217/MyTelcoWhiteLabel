import { useState } from 'react';
import { View } from 'react-native';
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
    const res = await authedFetch('/api/v1/customer/support/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'BILLING',
        subject: 'Unexpected roaming charge',
        description: 'I was billed for roaming while data roaming was disabled.',
        priority: 'NORMAL',
        attachments: [
          { fileName: 'invoice-mobile.jpg', contentType: 'image/jpeg', sizeBytes: 33210 },
        ],
      }),
    });
    const payload = (await res.json()) as SupportCase;
    setStatus(`Case created: ${payload.caseId}`);
    await loadCases();
    await loadCase(payload.caseId);
  };

  const loadCases = async () => {
    const res = await authedFetch('/api/v1/customer/support/cases');
    const payload = (await res.json()) as SupportCase[];
    setCases(payload);
    setStatus(`Loaded ${payload.length} support cases`);
  };

  const loadCase = async (caseId: string) => {
    const res = await authedFetch(`/api/v1/customer/support/cases/${caseId}`);
    setSelected((await res.json()) as SupportCase);
  };

  const addMessage = async () => {
    if (!selected) return;
    const res = await authedFetch(`/api/v1/customer/support/cases/${selected.caseId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor: 'mobile-customer',
        actorType: 'CUSTOMER',
        message: 'Please share ETA for first response.',
      }),
    });
    const payload = (await res.json()) as SupportCase;
    setSelected(payload);
    setStatus(`Timeline updated for ${payload.caseId}`);
  };

  return (
    <Card padding="md" shadow="md">
      <Typography variant="h4">Support case management (Issue #41)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>
      <Button
        title="Create support case"
        onPress={() => createCase().catch(() => setStatus('Create failed'))}
      />
      <Button
        title="Refresh case list"
        onPress={() => loadCases().catch(() => setStatus('Load failed'))}
        style={{ marginTop: 8 }}
      />
      <Button
        title="Add timeline message"
        onPress={() => addMessage().catch(() => setStatus('Timeline update failed'))}
        style={{ marginTop: 8 }}
      />

      {cases.slice(0, 5).map((item) => (
        <View key={item.caseId} style={{ marginTop: 8 }}>
          <Button
            title={`View ${item.caseId}`}
            onPress={() => loadCase(item.caseId).catch(() => setStatus('Detail failed'))}
          />
          <Typography variant="small" color="secondary">
            {item.category} · {item.status} · {item.slaTarget}
          </Typography>
        </View>
      ))}

      {selected && (
        <View style={{ marginTop: 8 }}>
          <Typography variant="body">Subject: {selected.subject}</Typography>
          <Typography variant="small" color="secondary">
            Expected response: {new Date(selected.expectedResponseAt).toLocaleString()}
          </Typography>
          <Typography variant="small" color="secondary">
            Attachments: {selected.attachments.map((a) => a.fileName).join(', ') || 'none'}
          </Typography>
          {selected.timeline.map((entry) => (
            <Typography key={entry.entryId} variant="small" color="secondary">
              {new Date(entry.timestamp).toLocaleString()} · {entry.actor} · {entry.message}
            </Typography>
          ))}
        </View>
      )}
    </Card>
  );
}
