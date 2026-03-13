import { useState } from 'react';
import { Button, Card, Typography } from '../../design-system';

type TroubleshootingFlow = {
  flowId: string;
  issueType: string;
  title: string;
  steps: string[];
};

type TroubleshootingSession = {
  sessionId: string;
  flowId: string;
  issueType: string;
  context: {
    lineId: string;
    deviceInfo: string;
    location?: string;
    timestamp: string;
  };
  completedSteps: string[];
  outcome?: string;
  status: string;
};

export function TroubleshootingPanel({
  authedFetch,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const [flows, setFlows] = useState<TroubleshootingFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState('');
  const [lineId, setLineId] = useState('line-web-1');
  const [deviceInfo, setDeviceInfo] = useState('Web Browser');
  const [location, setLocation] = useState('Lisbon/PT');
  const [session, setSession] = useState<TroubleshootingSession | null>(null);
  const [status, setStatus] = useState('Troubleshooting idle');

  const loadFlows = async () => {
    const response = await authedFetch('/api/v1/customer/troubleshooting/flows');
    const payload = (await response.json()) as TroubleshootingFlow[];
    setFlows(payload);
    setSelectedFlow(payload[0]?.flowId ?? '');
    setStatus(`Loaded ${payload.length} troubleshooting flows`);
  };

  const startSession = async () => {
    const response = await authedFetch('/api/v1/customer/troubleshooting/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowId: selectedFlow, lineId, deviceInfo, location }),
    });
    const payload = (await response.json()) as TroubleshootingSession;
    setSession(payload);
    setStatus(`Session ${payload.sessionId} started`);
  };

  const completeStep = async (stepId: string) => {
    if (!session) return;
    const response = await authedFetch(
      `/api/v1/customer/troubleshooting/session/${session.sessionId}/step`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      }
    );
    setSession((await response.json()) as TroubleshootingSession);
  };

  const resolve = async (outcome: 'resolved' | 'escalated' | 'unresolved') => {
    if (!session) return;
    const response = await authedFetch(
      `/api/v1/customer/troubleshooting/session/${session.sessionId}/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      }
    );
    const payload = (await response.json()) as TroubleshootingSession;
    setSession(payload);
    setStatus(`Outcome submitted: ${payload.outcome}`);
  };

  const flow = flows.find((item) => item.flowId === (session?.flowId || selectedFlow));

  return (
    <Card padding="md" shadow="md" style={{ marginBottom: 12 }}>
      <Typography variant="h4">Guided troubleshooting (Issue #40)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <Button size="sm" onClick={() => loadFlows().catch(() => setStatus('Flow load failed'))}>
          Load issue flows
        </Button>
      </div>

      {flows.length > 0 && !session && (
        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          <label>
            Issue flow
            <select value={selectedFlow} onChange={(event) => setSelectedFlow(event.target.value)}>
              {flows.map((item) => (
                <option key={item.flowId} value={item.flowId}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Line ID
            <input value={lineId} onChange={(event) => setLineId(event.target.value)} />
          </label>
          <label>
            Device info
            <input value={deviceInfo} onChange={(event) => setDeviceInfo(event.target.value)} />
          </label>
          <label>
            Location (optional)
            <input value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <Button
            size="sm"
            onClick={() => startSession().catch(() => setStatus('Failed to start session'))}
          >
            Start troubleshooting
          </Button>
        </div>
      )}

      {session && flow && (
        <div style={{ marginTop: 10 }}>
          <Typography variant="small" color="secondary">
            Context: {session.context.lineId} | {session.context.deviceInfo} |{' '}
            {session.context.location || 'n/a'} |{' '}
            {new Date(session.context.timestamp).toLocaleString()}
          </Typography>
          <Typography variant="body" style={{ marginTop: 8 }}>
            Steps for {flow.title}
          </Typography>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {flow.steps.map((step) => (
              <Button
                key={step}
                size="sm"
                onClick={() => completeStep(step).catch(() => setStatus('Step update failed'))}
                disabled={session.completedSteps.includes(step) || session.status === 'RESOLVED'}
              >
                {session.completedSteps.includes(step) ? `✓ ${step}` : `Complete ${step}`}
              </Button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <Button
              size="sm"
              onClick={() => resolve('resolved').catch(() => setStatus('Outcome failed'))}
            >
              Mark resolved
            </Button>
            <Button
              size="sm"
              onClick={() => resolve('escalated').catch(() => setStatus('Outcome failed'))}
            >
              Escalate
            </Button>
            <Button
              size="sm"
              onClick={() => resolve('unresolved').catch(() => setStatus('Outcome failed'))}
            >
              Mark unresolved
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
