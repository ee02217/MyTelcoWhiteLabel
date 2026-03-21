import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useLines } from './useLines';
import { LineDetails } from './types';

type AuthedFetch = (path: string, init?: RequestInit) => Promise<Response>;

interface LinesPanelProps {
  authedFetch: AuthedFetch;
}

export function LinesPanel({ authedFetch }: LinesPanelProps) {
  const {
    lines,
    loading,
    saving,
    error,
    getLineDetails,
    addLine,
    cancelLine,
    getProrationPreview,
    changePlan,
  } = useLines(authedFetch);

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [selectedLine, setSelectedLine] = useState<LineDetails | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);

  const handleLineClick = async (lineId: string) => {
    const details = await getLineDetails(lineId);
    setSelectedLine(details);
  };

  const handleAddLine = async () => {
    await addLine({
      phoneNumber: '+351919999999',
      planId: 'plan-1',
      simType: 'ESIM',
      deliveryAddress: '123 Main St, Lisbon',
    });
    setActiveTab('list');
  };

  const handleCancel = async (keepNumber: boolean) => {
    if (selectedLine) {
      await cancelLine(selectedLine.lineId, keepNumber, 'Customer request');
      setShowCancel(false);
      setSelectedLine(null);
    }
  };

  const handlePlanChange = async () => {
    if (selectedLine) {
      await changePlan(selectedLine.lineId, 'plan-new');
      setShowPlanChange(false);
      const updated = await getLineDetails(selectedLine.lineId);
      setSelectedLine(updated);
    }
  };

  if (loading) {
    return (
      <Card>
        <Typography variant="h2">Lines</Typography>
        <Typography>Loading...</Typography>
      </Card>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">My Lines</Typography>

      {error && <Typography color="error" style={{ marginBottom: '8px' }}>{error}</Typography>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button
          variant={activeTab === 'list' ? 'primary' : 'secondary'}
          onClick={() => { setActiveTab('list'); setSelectedLine(null); }}
        >
          My Lines
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('add')}
        >
          Add Line
        </Button>
      </div>

      {/* Add Line Tab */}
      {activeTab === 'add' && (
        <Card>
          <Typography variant="h3">Add New Line</Typography>
          <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
            Get a new phone number or transfer your existing number.
          </Typography>

          <div style={{ marginBottom: '12px' }}>
            <Typography variant="body">Select SIM Type</Typography>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <Button variant="secondary" onClick={() => {}}>eSIM</Button>
              <Button variant="secondary" onClick={() => {}}>Physical SIM</Button>
            </div>
          </div>

          <Typography variant="caption" style={{ marginBottom: '4px', display: 'block' }}>
            Enter delivery address for physical SIM
          </Typography>

          <Button 
            variant="primary" 
            onClick={handleAddLine}
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add Line (Demo)'}
          </Button>
        </Card>
      )}

      {/* Lines List Tab */}
      {activeTab === 'list' && !selectedLine && (
        <div>
          {lines.length === 0 ? (
            <Card>
              <Typography>No lines found</Typography>
              <Button variant="primary" onClick={() => setActiveTab('add')} style={{ marginTop: '8px' }}>
                Add Your First Line
              </Button>
            </Card>
          ) : (
            lines.map(line => (
              <Card 
                key={line.lineId} 
                style={{ 
                  marginBottom: '8px',
                  borderLeft: line.status === 'ACTIVE' ? '3px solid #27ae60' : 
                             line.status === 'PENDING_CANCEL' ? '3px solid #e74c3c' : '1px solid #ddd'
                }}
              >
                <Typography variant="body" style={{ fontWeight: 'bold' }}>{line.phoneNumber}</Typography>
                <Typography variant="caption">{line.planName} • {line.simType}</Typography>
                <Typography 
                  variant="caption" 
                  style={{ 
                    color: line.status === 'ACTIVE' ? '#27ae60' : 
                           line.status === 'PENDING_CANCEL' ? '#e74c3c' : '#666'
                  }}
                >
                  {line.status.replace('_', ' ')}
                </Typography>
                <Button 
                  variant="secondary" 
                  onClick={() => handleLineClick(line.lineId)}
                  style={{ marginTop: '8px' }}
                >
                  View Details
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Line Details */}
      {selectedLine && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h3">{selectedLine.phoneNumber}</Typography>
            <Button variant="secondary" onClick={() => setSelectedLine(null)}>← Back</Button>
          </div>

          <Typography variant="caption" style={{ color: '#666' }}>
            {selectedLine.planName} • €{selectedLine.planPrice}/month
          </Typography>

          {/* eSIM QR Code */}
          {selectedLine.simType === 'ESIM' && selectedLine.esimQrCode && (
            <Card style={{ marginTop: '12px', backgroundColor: '#f9f9f9' }}>
              <Typography variant="h3">eSIM Activation</Typography>
              <Typography variant="caption" style={{ marginBottom: '8px', display: 'block' }}>
                Scan this QR code with your phone's camera to activate eSIM.
              </Typography>
              <div style={{ 
                backgroundColor: '#fff', 
                padding: '12px', 
                borderRadius: '8px',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                <img 
                  src={selectedLine.esimQrCode} 
                  alt="eSIM QR Code" 
                  style={{ width: '150px', height: '150px' }} 
                />
              </div>
              {selectedLine.esimActivationCode && (
                <Typography variant="caption">
                  Or enter code: <strong>{selectedLine.esimActivationCode}</strong>
                </Typography>
              )}
            </Card>
          )}

          {/* SIM Delivery */}
          {selectedLine.deliveryStatus && selectedLine.deliveryStatus !== 'DELIVERED' && (
            <Card style={{ marginTop: '12px' }}>
              <Typography variant="h3">SIM Delivery</Typography>
              <Typography variant="caption">
                Status: <strong>{selectedLine.deliveryStatus}</strong>
              </Typography>
              {selectedLine.estimatedDelivery && (
                <Typography variant="caption">
                  Est. Delivery: {selectedLine.estimatedDelivery}
                </Typography>
              )}
            </Card>
          )}

          {/* SIM Card Info */}
          {selectedLine.iccid && (
            <Card style={{ marginTop: '12px' }}>
              <Typography variant="h3">SIM Information</Typography>
              <Typography variant="caption">ICCID: {selectedLine.iccid}</Typography>
              {selectedLine.ean13Code && (
                <Typography variant="caption">EAN-13: {selectedLine.ean13Code}</Typography>
              )}
            </Card>
          )}

          {/* Actions */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setShowPlanChange(true)}>
              Change Plan
            </Button>
            {selectedLine.status !== 'PENDING_CANCEL' && (
              <Button variant="danger" onClick={() => setShowCancel(true)}>
                Cancel Line
              </Button>
            )}
          </div>

          {/* Plan Change Preview */}
          {showPlanChange && (
            <Card style={{ marginTop: '12px', backgroundColor: '#fff3cd' }}>
              <Typography variant="h3">Change Plan</Typography>
              <Typography variant="caption" style={{ marginBottom: '8px', display: 'block' }}>
                Current: {selectedLine.planName} → New: Premium 50GB
              </Typography>
              <Typography variant="caption">Proration: Credit €10.32 - Charge €9.68 = €-0.64 credit</Typography>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button variant="primary" onClick={handlePlanChange} disabled={saving}>
                  Confirm Change
                </Button>
                <Button variant="secondary" onClick={() => setShowPlanChange(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Cancel Flow */}
          {showCancel && (
            <Card style={{ marginTop: '12px', backgroundColor: '#f8d7da' }}>
              <Typography variant="h3">Cancel Line</Typography>
              <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
                Are you sure you want to cancel {selectedLine.phoneNumber}?
              </Typography>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button variant="danger" onClick={() => handleCancel(false)}>
                  Cancel & Release Number
                </Button>
                <Button variant="secondary" onClick={() => handleCancel(true)}>
                  Cancel & Keep Number
                </Button>
                <Button variant="secondary" onClick={() => setShowCancel(false)}>
                  Keep Line
                </Button>
              </div>
            </Card>
          )}
        </Card>
      )}
    </div>
  );
}
