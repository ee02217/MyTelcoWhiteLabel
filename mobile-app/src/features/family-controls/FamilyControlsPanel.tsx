import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useSharedControls } from './useSharedControls';
import {
  SharedControlCategory,
  SharedControlCapUpdateRequest,
  SharedControlOverrideCreateRequest,
  SharedControlOverrideDecisionRequest,
} from './types';

const categoryLabels: Record<SharedControlCategory, string> = {
  DATA_MB: 'Data (MB)',
  VOICE_MIN: 'Voice (min)',
  SMS_COUNT: 'SMS',
  SPEND_EUR: 'Spend (€)',
  ADDON_PURCHASES: 'Add-ons',
};

export function FamilyControlsPanel() {
  const { controls, loading, error, refetch, updateCap, createOverrideRequest, decideOverride } = useSharedControls();
  const [activeTab, setActiveTab] = useState<'overview' | 'caps' | 'alerts' | 'overrides'>('overview');
  const [editingCap, setEditingCap] = useState<string | null>(null);
  const [newCapLimit, setNewCapLimit] = useState<number>(0);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ lineId: '', category: 'DATA_MB' as SharedControlCategory, requestedLimit: 0, reason: '' });

  if (loading) {
    return (
      <Card>
        <Typography variant="h2">Family Controls</Typography>
        <Typography>Loading...</Typography>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Typography variant="h2">Family Controls</Typography>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={refetch}>Retry</Button>
      </Card>
    );
  }

  if (!controls) {
    return (
      <Card>
        <Typography variant="h2">Family Controls</Typography>
        <Typography>No controls data available</Typography>
      </Card>
    );
  }

  const isOwner = controls.actingRole === 'OWNER';
  const isManager = controls.actingRole === 'MANAGER' || isOwner;

  const handleSaveCap = async (lineId: string, category: SharedControlCategory) => {
    const req: SharedControlCapUpdateRequest = { lineId, category, limit: newCapLimit, alertThreshold: Math.round(newCapLimit * 0.8) };
    await updateCap(req);
    setEditingCap(null);
  };

  const handleCreateOverride = async () => {
    const req: SharedControlOverrideCreateRequest = {
      lineId: overrideForm.lineId,
      category: overrideForm.category,
      requestedLimit: overrideForm.requestedLimit,
      reason: overrideForm.reason,
    };
    await createOverrideRequest(req);
    setShowOverrideForm(false);
    setOverrideForm({ lineId: '', category: 'DATA_MB', requestedLimit: 0, reason: '' });
  };

  const handleDecideOverride = async (requestId: string, decision: 'APPROVE' | 'DENY') => {
    const req: SharedControlOverrideDecisionRequest = { requestId, decision };
    await decideOverride(req);
  };

  const getUsageForCap = (lineId: string, category: SharedControlCategory) => {
    return controls.usage.find(u => u.lineId === lineId && u.category === category);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">Family Controls</Typography>
      <Typography variant="caption" style={{ marginBottom: '16px', display: 'block' }}>
        Managing: {controls.roleByLine[controls.actingLineId] || controls.actingLineId} ({controls.actingRole})
      </Typography>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['overview', 'caps', 'alerts', 'overrides'] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <Typography variant="h3">Usage Overview</Typography>
          {controls.caps.slice(0, 5).map(cap => {
            const usage = getUsageForCap(cap.lineId, cap.category);
            const pct = usage ? (usage.used / cap.limit) * 100 : 0;
            return (
              <Card key={`${cap.lineId}-${cap.category}`} style={{ marginBottom: '8px' }}>
                <Typography variant="body">{categoryLabels[cap.category]}</Typography>
                <Typography variant="caption">{controls.roleByLine[cap.lineId] || cap.lineId}</Typography>
                <div style={{ background: '#eee', height: '8px', borderRadius: '4px', marginTop: '8px' }}>
                  <div style={{ background: pct > 90 ? '#e74c3c' : pct > 70 ? '#f39c12' : '#27ae60', width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: '4px' }} />
                </div>
                <Typography variant="caption">
                  {usage?.used.toFixed(0) || 0} / {cap.limit} ({pct.toFixed(0)}%)
                </Typography>
              </Card>
            );
          })}
        </div>
      )}

      {/* Caps Tab */}
      {activeTab === 'caps' && isManager && (
        <div>
          <Typography variant="h3">Spending & Usage Caps</Typography>
          {controls.caps.map(cap => (
            <Card key={`${cap.lineId}-${cap.category}`} style={{ marginBottom: '8px' }}>
              <Typography variant="body">{categoryLabels[cap.category]}</Typography>
              <Typography variant="caption">{controls.roleByLine[cap.lineId] || cap.lineId}</Typography>
              {editingCap === `${cap.lineId}-${cap.category}` ? (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="number"
                    value={newCapLimit}
                    onChange={e => setNewCapLimit(Number(e.target.value))}
                    style={{ padding: '4px', marginRight: '8px' }}
                  />
                  <Button onClick={() => handleSaveCap(cap.lineId, cap.category)}>Save</Button>
                  <Button variant="secondary" onClick={() => setEditingCap(null)}>Cancel</Button>
                </div>
              ) : (
                <div style={{ marginTop: '8px' }}>
                  <Typography>Limit: {cap.limit}</Typography>
                  <Typography variant="caption">Alert at {cap.alertThreshold} ({cap.alertLevel})</Typography>
                  {isOwner && (
                    <Button variant="secondary" onClick={() => { setEditingCap(`${cap.lineId}-${cap.category}`); setNewCapLimit(cap.limit); }}>
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          <Typography variant="h3">Alerts</Typography>
          {controls.alerts.length === 0 ? (
            <Typography>No active alerts</Typography>
          ) : (
            controls.alerts.map(alert => (
              <Card key={alert.id} style={{ marginBottom: '8px', borderLeft: `4px solid ${alert.level === 'CRITICAL' ? '#e74c3c' : '#f39c12'}` }}>
                <Typography variant="body">{alert.message}</Typography>
                <Typography variant="caption">{categoryLabels[alert.category]} - {new Date(alert.createdAt).toLocaleString()}</Typography>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Overrides Tab */}
      {activeTab === 'overrides' && (
        <div>
          <Typography variant="h3">Override Requests</Typography>
          
          {!isOwner && !showOverrideForm && (
            <Button onClick={() => setShowOverrideForm(true)}>Request Override</Button>
          )}

          {showOverrideForm && (
            <Card style={{ marginBottom: '16px' }}>
              <Typography variant="body">New Override Request</Typography>
              <select
                value={overrideForm.lineId}
                onChange={e => setOverrideForm({ ...overrideForm, lineId: e.target.value })}
                style={{ padding: '4px', margin: '4px 0', width: '100%' }}
              >
                <option value="">Select line</option>
                {Object.keys(controls.roleByLine).map(lineId => (
                  <option key={lineId} value={lineId}>{controls.roleByLine[lineId] || lineId}</option>
                ))}
              </select>
              <select
                value={overrideForm.category}
                onChange={e => setOverrideForm({ ...overrideForm, category: e.target.value as SharedControlCategory })}
                style={{ padding: '4px', margin: '4px 0', width: '100%' }}
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Requested limit"
                value={overrideForm.requestedLimit}
                onChange={e => setOverrideForm({ ...overrideForm, requestedLimit: Number(e.target.value) })}
                style={{ padding: '4px', margin: '4px 0', width: '100%' }}
              />
              <input
                type="text"
                placeholder="Reason"
                value={overrideForm.reason}
                onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                style={{ padding: '4px', margin: '4px 0', width: '100%' }}
              />
              <Button onClick={handleCreateOverride}>Submit</Button>
              <Button variant="secondary" onClick={() => setShowOverrideForm(false)}>Cancel</Button>
            </Card>
          )}

          {controls.overrideRequests.length === 0 ? (
            <Typography>No override requests</Typography>
          ) : (
            controls.overrideRequests.map(req => (
              <Card key={req.requestId} style={{ marginBottom: '8px' }}>
                <Typography variant="body">{categoryLabels[req.category]} - {req.status}</Typography>
                <Typography variant="caption">
                  Requested: {req.requestedLimit} by {req.requestedBy} on {new Date(req.requestedAt).toLocaleString()}
                </Typography>
                {req.reason && <Typography>Reason: {req.reason}</Typography>}
                {isOwner && req.status === 'PENDING' && (
                  <div style={{ marginTop: '8px' }}>
                    <Button onClick={() => handleDecideOverride(req.requestId, 'APPROVE')}>Approve</Button>
                    <Button variant="danger" onClick={() => handleDecideOverride(req.requestId, 'DENY')}>Deny</Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
