import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useDevices, useDiagnostics } from './useDevices';
import { DeviceCompatibilityCheck } from './types';

const testTypeLabels: Record<string, string> = {
  SIGNAL_STRENGTH: 'Signal Strength',
  DATA_CONNECTIVITY: 'Data Connectivity',
  VOICE_CALL: 'Voice Call',
  SMS_DELIVERY: 'SMS Delivery',
  APN_CONFIGURATION: 'APN Config',
  LATENCY_TEST: 'Latency',
};

export function DevicePanel() {
  const { devices, loading, error, refetch, checkCompatibility, unlinkDevice } = useDevices();
  const { results, loading: diagLoading, runDiagnostics, escalate } = useDiagnostics();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [compatibility, setCompatibility] = useState<DeviceCompatibilityCheck | null>(null);

  if (loading) {
    return (
      <Card>
        <Typography variant="h2">Device Dashboard</Typography>
        <Typography>Loading devices...</Typography>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Typography variant="h2">Device Dashboard</Typography>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={refetch}>Retry</Button>
      </Card>
    );
  }

  const handleCheckCompatibility = async (lineId: string) => {
    setSelectedDevice(lineId);
    const result = await checkCompatibility(lineId);
    setCompatibility(result);
  };

  const handleRunDiagnostics = async (lineId: string) => {
    setSelectedDevice(lineId);
    await runDiagnostics(lineId);
  };

  const handleEscalate = async (lineId: string) => {
    if (!results) return;
    const summary = results.results.map(r => `${r.testType}: ${r.severity}`).join(', ');
    await escalate(lineId, summary);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">Device Dashboard</Typography>
      <Typography variant="caption" style={{ marginBottom: '16px', display: 'block' }}>
        Manage your devices and run diagnostics
      </Typography>

      {devices.length === 0 ? (
        <Typography>No devices found</Typography>
      ) : (
        devices.map(device => (
          <Card key={device.lineId} style={{ marginBottom: '12px' }}>
            <Typography variant="h4">{device.deviceModel}</Typography>
            <Typography variant="caption">MSISDN: {device.msisdn}</Typography>
            <Typography variant="caption">IMEI: {device.imei}</Typography>
            <Typography variant="caption">eSIM: {device.esimCapable ? '✓ Supported' : '✗ Not supported'}</Typography>
            <Typography variant="caption">SIM Status: {device.simStatus}</Typography>
            <Typography variant="caption">Network: {device.networkStatus}</Typography>

            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => handleCheckCompatibility(device.lineId)}>
                Check Compatibility
              </Button>
              <Button variant="secondary" onClick={() => handleRunDiagnostics(device.lineId)}>
                Run Diagnostics
              </Button>
              <Button variant="danger" onClick={() => unlinkDevice(device.lineId)}>
                Unlink
              </Button>
            </div>

            {selectedDevice === device.lineId && compatibility && (
              <Card style={{ marginTop: '8px', backgroundColor: '#f5f5f5' }}>
                <Typography variant="body">Compatibility Check</Typography>
                <Typography variant="caption">
                  Plan: {compatibility.planCompatible ? '✓' : '✗'} {compatibility.planMessage}
                </Typography>
                <Typography variant="caption">
                  Roaming: {compatibility.roamingCompatible ? '✓' : '✗'} {compatibility.roamingMessage}
                </Typography>
              </Card>
            )}
          </Card>
        ))
      )}

      {diagLoading && (
        <Card>
          <Typography>Running diagnostics...</Typography>
        </Card>
      )}

      {results && selectedDevice && (
        <Card style={{ marginTop: '16px' }}>
          <Typography variant="h4">Diagnostic Results</Typography>
          <Typography variant="caption">
            Overall: {results.overallSeverity}
            {results.escalationRecommended && ' - Escalation Recommended'}
          </Typography>

          {results.results.map((result, idx) => (
            <Card key={idx} style={{ 
              marginTop: '8px', 
              borderLeft: `4px solid ${
                result.severity === 'OK' ? '#27ae60' : 
                result.severity === 'WARNING' ? '#f39c12' : '#e74c3c'
              }` 
            }}>
              <Typography variant="body">{testTypeLabels[result.testType] || result.testType}</Typography>
              <Typography variant="caption">{result.message}</Typography>
              <Typography variant="caption" color="secondary">
                {result.nextStepGuidance}
              </Typography>
            </Card>
          ))}

          {results.escalationRecommended && (
            <Button variant="primary" onClick={() => handleEscalate(selectedDevice)} style={{ marginTop: '12px' }}>
              Escalate to Support
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
