import { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Button, Badge } from '../../design-system';

const API_BASE = '/api/v1/admin/journeys';

interface Journey {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED';
  trigger: string;
  triggerLabel: string;
  steps: JourneyStep[];
  stats: JourneyStats;
  createdAt: string;
  updatedAt: string;
}

interface JourneyStep {
  id: string;
  type: string;
  typeLabel: string;
  order: number;
  config?: Record<string, any>;
}

interface JourneyStats {
  triggered: number;
  completed: number;
  abandoned: number;
  conversionRate: number;
}

const TRIGGER_OPTIONS: Record<string, string> = {
  USER_CREATED: 'User Signs Up',
  USAGE_THRESHOLD: 'High Usage Detected',
  LOW_USAGE_DETECTED: 'Low Usage Warning',
  BILLING_FAILED: 'Payment Failed',
  PLAN_EXPIRING: 'Plan Expiring Soon',
  INACTIVITY: 'Account Inactive'
};

const STEP_TYPES: Record<string, string> = {
  WELCOME_EMAIL: '📧 Welcome Email',
  SMS_VERIFICATION: '📱 SMS Verification',
  PLAN_SELECTION: '📋 Plan Selection',
  PAYMENT_SETUP: '💳 Payment Setup',
  ANALYTICS_ALERT: '⚠️ Analytics Alert',
  OFFER_PRESENTATION: '🎁 Show Offer',
  WAIT_48H: '⏳ Wait 48 Hours',
  RETENTION_OFFER: '💰 Retention Offer',
  USAGE_INSIGHT: '📊 Usage Insight',
  PLAN_COMPARISON: '📈 Plan Comparison',
  CHECKOUT: '🛒 Checkout Flow',
  PUSH_NOTIFICATION: '🔔 Push Notification',
  SURVEY: '📝 Customer Survey'
};

export function JourneysPanel() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [newJourney, setNewJourney] = useState({ 
    name: '', 
    description: '', 
    trigger: 'USER_CREATED' 
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'DRAFT' | 'PAUSED'>('all');

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    
    // Transform data with labels
    const transformed = data.map((j: any) => ({
      ...j,
      triggerLabel: TRIGGER_OPTIONS[j.trigger] || j.trigger,
      steps: (j.steps || []).map((s: any) => ({
        ...s,
        typeLabel: STEP_TYPES[s.type] || s.type
      })),
      stats: {
        triggered: j.stats?.triggered || 0,
        completed: j.stats?.completed || 0,
        abandoned: j.stats?.abandoned || 0,
        conversionRate: j.stats?.triggered 
          ? ((j.stats.completed / j.stats.triggered) * 100) 
          : 0
      }
    }));
    
    setJourneys(transformed);
    setLoading(false);
  };

  const filteredJourneys = useMemo(() => {
    if (statusFilter === 'all') return journeys;
    return journeys.filter(j => j.status === statusFilter);
  }, [journeys, statusFilter]);

  const totalStats = useMemo(() => ({
    total: journeys.length,
    active: journeys.filter(j => j.status === 'ACTIVE').length,
    drafts: journeys.filter(j => j.status === 'DRAFT').length,
    totalTriggered: journeys.reduce((sum, j) => sum + (j.stats?.triggered || 0), 0),
    totalCompleted: journeys.reduce((sum, j) => sum + (j.stats?.completed || 0), 0)
  }), [journeys]);

  const handleCreate = async () => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJourney)
    });
    setShowCreate(false);
    setNewJourney({ name: '', description: '', trigger: 'USER_CREATED' });
    fetchJourneys();
  };

  const handleStatusChange = async (id: string, status: 'ACTIVE' | 'PAUSED' | 'DRAFT') => {
    if (status === 'ACTIVE') {
      await fetch(API_BASE + '/' + id + '/publish', { method: 'POST' });
    } else {
      await fetch(API_BASE + '/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    }
    fetchJourneys();
    if (selectedJourney?.id === id) {
      const updated = await fetch(API_BASE + '/' + id).then(r => r.json());
      setSelectedJourney(updated);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journey? This cannot be undone.')) return;
    await fetch(API_BASE + '/' + id, { method: 'DELETE' });
    setSelectedJourney(null);
    fetchJourneys();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#27ae60';
      case 'PAUSED': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getStepColor = (type: string) => {
    if (type.includes('EMAIL') || type.includes('NOTIFICATION')) return '#3498db';
    if (type.includes('OFFER') || type.includes('CHECKOUT')) return '#27ae60';
    if (type.includes('WAIT')) return '#9b59b6';
    if (type.includes('ALERT') || type.includes('SURVEY')) return '#e74c3c';
    return '#666';
  };

  if (loading) return <Typography>Loading journeys...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Typography variant="h2">Journey & Flow Management</Typography>
          <Typography variant="caption" color="secondary">
            Design and manage automated customer journeys
          </Typography>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>+ Create Journey</Button>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <Card style={{ textAlign: 'center', padding: '16px' }}>
          <Typography variant="h3">{totalStats.total}</Typography>
          <Typography variant="caption">Total Journeys</Typography>
        </Card>
        <Card style={{ textAlign: 'center', padding: '16px', borderTop: '3px solid #27ae60' }}>
          <Typography variant="h3" style={{ color: '#27ae60' }}>{totalStats.active}</Typography>
          <Typography variant="caption">Active</Typography>
        </Card>
        <Card style={{ textAlign: 'center', padding: '16px', borderTop: '3px solid #f39c12' }}>
          <Typography variant="h3" style={{ color: '#f39c12' }}>{totalStats.drafts}</Typography>
          <Typography variant="caption">Drafts</Typography>
        </Card>
        <Card style={{ textAlign: 'center', padding: '16px', borderTop: '3px solid #3498db' }}>
          <Typography variant="h3">{totalStats.totalTriggered.toLocaleString()}</Typography>
          <Typography variant="caption">Total Triggered</Typography>
        </Card>
        <Card style={{ textAlign: 'center', padding: '16px', borderTop: '3px solid #9b59b6' }}>
          <Typography variant="h3">{totalStats.totalCompleted.toLocaleString()}</Typography>
          <Typography variant="caption">Completed</Typography>
        </Card>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['all', 'ACTIVE', 'DRAFT', 'PAUSED'] as const).map(status => (
          <Button
            key={status}
            variant={statusFilter === status ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : status}
          </Button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedJourney ? '1fr 1fr' : '1fr', gap: '16px' }}>
        {/* Journey List */}
        <div>
          <Typography variant="h3" style={{ marginBottom: '12px' }}>All Journeys</Typography>
          {filteredJourneys.length === 0 ? (
            <Card>
              <Typography>No journeys found</Typography>
            </Card>
          ) : (
            filteredJourneys.map(journey => (
              <Card 
                key={journey.id}
                style={{ 
                  marginBottom: '8px', 
                  cursor: 'pointer',
                  border: selectedJourney?.id === journey.id ? '2px solid #3498db' : '1px solid #eee',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedJourney(journey)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Typography variant="body" style={{ fontWeight: 600 }}>{journey.name}</Typography>
                    <Typography variant="caption" color="secondary">{journey.description}</Typography>
                  </div>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px',
                    backgroundColor: getStatusColor(journey.status) + '20',
                    color: getStatusColor(journey.status),
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {journey.status}
                  </span>
                </div>
                
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
                  <span>🎯 {journey.triggerLabel}</span>
                  <span>📝 {journey.steps?.length || 0} steps</span>
                </div>

                {/* Mini Progress Bar */}
                {journey.stats?.triggered > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Typography variant="caption">Completion Rate</Typography>
                      <Typography variant="caption">{journey.stats.conversionRate.toFixed(1)}%</Typography>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${journey.stats.conversionRate}%`,
                          backgroundColor: journey.stats.conversionRate > 50 ? '#27ae60' : journey.stats.conversionRate > 25 ? '#f39c12' : '#e74c3c',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Journey Details & Flow Visualizer */}
        {selectedJourney && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <Typography variant="h3">{selectedJourney.name}</Typography>
                <Typography variant="caption" color="secondary">{selectedJourney.description}</Typography>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedJourney(null)}>✕</Button>
            </div>

            {/* Flow Visualizer */}
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="body" style={{ fontWeight: 600, marginBottom: '12px' }}>Flow</Typography>
              
              {/* Trigger Node */}
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#e8f4fd', 
                borderRadius: '8px', 
                border: '2px solid #3498db',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                <Typography variant="caption" style={{ color: '#3498db', fontWeight: 600 }}>TRIGGER</Typography>
                <Typography variant="body">{selectedJourney.triggerLabel}</Typography>
              </div>

              {/* Steps */}
              {selectedJourney.steps?.map((step, index) => (
                <div key={step.id}>
                  {/* Connector Line */}
                  <div style={{ 
                    height: '20px', 
                    width: '2px', 
                    backgroundColor: '#ddd',
                    margin: '0 auto',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      border: '2px solid #ddd'
                    }}>
                      <span style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        fontSize: '10px',
                        color: '#999'
                      }}>
                        ↓
                      </span>
                    </div>
                  </div>
                  
                  {/* Step Node */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: getStepColor(step.type) + '10',
                    borderRadius: '8px', 
                    border: `2px solid ${getStepColor(step.type)}`,
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: getStepColor(step.type),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {step.order}
                      </span>
                      <Typography variant="body" style={{ fontWeight: 500 }}>{step.typeLabel}</Typography>
                    </div>
                  </div>
                </div>
              ))}

              {/* End Node */}
              <div style={{ 
                height: '20px', 
                width: '2px', 
                backgroundColor: '#ddd',
                margin: '0 auto'
              }} />
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '2px dashed #ccc'
              }}>
                <Typography variant="caption" style={{ color: '#999' }}>END</Typography>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Typography variant="h3">{selectedJourney.stats.triggered.toLocaleString()}</Typography>
                <Typography variant="caption">Triggered</Typography>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <Typography variant="h3" style={{ color: '#27ae60' }}>{selectedJourney.stats.completed.toLocaleString()}</Typography>
                <Typography variant="caption">Completed</Typography>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
                <Typography variant="h3" style={{ color: '#e74c3c' }}>{selectedJourney.stats.abandoned.toLocaleString()}</Typography>
                <Typography variant="caption">Abandoned</Typography>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedJourney.status === 'DRAFT' && (
                <Button variant="primary" size="sm" onClick={() => handleStatusChange(selectedJourney.id, 'ACTIVE')}>
                  ▶ Publish
                </Button>
              )}
              {selectedJourney.status === 'ACTIVE' && (
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange(selectedJourney.id, 'PAUSED')}>
                  ⏸ Pause
                </Button>
              )}
              {selectedJourney.status === 'PAUSED' && (
                <Button variant="primary" size="sm" onClick={() => handleStatusChange(selectedJourney.id, 'ACTIVE')}>
                  ▶ Resume
                </Button>
              )}
              <Button variant="secondary" size="sm">✏️ Edit</Button>
              <Button variant="ghost" size="sm" style={{ color: '#e74c3c' }} onClick={() => handleDelete(selectedJourney.id)}>
                🗑️ Delete
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ width: '480px', padding: '24px' }}>
            <Typography variant="h3" style={{ marginBottom: '20px' }}>Create New Journey</Typography>
            
            <div style={{ marginBottom: '16px' }}>
              <Typography variant="caption">Journey Name</Typography>
              <input 
                type="text" 
                value={newJourney.name}
                onChange={(e) => setNewJourney({ ...newJourney, name: e.target.value })}
                placeholder="e.g., Welcome Series"
                style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Typography variant="caption">Description</Typography>
              <textarea 
                value={newJourney.description}
                onChange={(e) => setNewJourney({ ...newJourney, description: e.target.value })}
                placeholder="What does this journey do?"
                style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '6px', minHeight: '80px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Typography variant="caption">Trigger Event</Typography>
              <select 
                value={newJourney.trigger}
                onChange={(e) => setNewJourney({ ...newJourney, trigger: e.target.value })}
                style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                {Object.entries(TRIGGER_OPTIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <Typography variant="caption" color="secondary" style={{ marginTop: '4px', display: 'block' }}>
                This event will trigger the journey for customers
              </Typography>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={!newJourney.name}>Create Journey</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
