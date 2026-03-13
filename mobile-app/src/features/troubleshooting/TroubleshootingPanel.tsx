import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button, Card, Typography } from '../../design-system';

type TroubleshootingFlow = {
  flowId: string;
  title: string;
  steps: string[];
};

type TroubleshootingSession = {
  sessionId: string;
  flowId: string;
  context: {
    lineId: string;
    deviceInfo: string;
    location?: string;
    timestamp: string;
  };
  completedSteps: string[];
  outcome?: string;
};

export function TroubleshootingPanel({
  authedFetch,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const [flows, setFlows] = useState<TroubleshootingFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState('');
  const [lineId, setLineId] = useState('line-mobile-1');
  const [deviceInfo, setDeviceInfo] = useState('iOS/Android device');
  const [location, setLocation] = useState('Portugal');
  const [session, setSession] = useState<TroubleshootingSession | null>(null);
  const [status, setStatus] = useState('Troubleshooting idle');

  const loadFlows = async () => {
    const response = await authedFetch('/api/v1/customer/troubleshooting/flows');
    const payload = (await response.json()) as TroubleshootingFlow[];
    setFlows(payload);
    setSelectedFlow(payload[0]?.flowId ?? '');
    setStatus(`Loaded ${payload.length} issue flows`);
  };

  const startSession = async () => {
    const response = await authedFetch('/api/v1/customer/troubleshooting/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowId: selectedFlow, lineId, deviceInfo, location }),
    });
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
    setStatus(`Outcome: ${payload.outcome}`);
  };

  return (
    <Card padding="md" shadow="md">
      <Typography variant="h4">Guided troubleshooting (Issue #40)</Typography>
      <Typography variant="small" color="secondary">
        {status}
      </Typography>
      <Button
        title="Load issue flows"
        onPress={() => loadFlows().catch(() => setStatus('Flow load failed'))}
      />

      {flows.length > 0 && !session && (
        <View style={{ marginTop: 8 }}>
          <Typography variant="small" color="secondary">
            Selected flow: {selectedFlow}
          </Typography>
          {flows.map((flow) => (
            <Button
              key={flow.flowId}
              title={flow.title}
              onPress={() => setSelectedFlow(flow.flowId)}
            />
          ))}
          <TextInput value={lineId} onChangeText={setLineId} placeholder="Line ID" />
          <TextInput value={deviceInfo} onChangeText={setDeviceInfo} placeholder="Device info" />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Location (optional)"
          />
          <Button
            title="Start troubleshooting"
            onPress={() => startSession().catch(() => setStatus('Start failed'))}
          />
        </View>
      )}

      {session && (
        <View style={{ marginTop: 8 }}>
          <Typography variant="small" color="secondary">
            Context: {session.context.lineId} | {session.context.deviceInfo} |{' '}
            {session.context.location || 'n/a'}
          </Typography>
          <Button
            title="Resolved"
            onPress={() => resolve('resolved').catch(() => setStatus('Outcome failed'))}
          />
          <Button
            title="Escalated"
            onPress={() => resolve('escalated').catch(() => setStatus('Outcome failed'))}
          />
          <Button
            title="Unresolved"
            onPress={() => resolve('unresolved').catch(() => setStatus('Outcome failed'))}
          />
        </View>
      )}
    </Card>
  );
}
