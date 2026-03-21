import { useState, useEffect } from 'react';
import { Card, Typography, Button } from '../../design-system';

const API_BASE = '/api/v1/admin/journeys';

interface Journey {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED';
  trigger: string;
  steps: any[];
  stats: { triggered: number; completed: number; abandoned: number };
}

export function JourneysPanel() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newJourney, setNewJourney] = useState({ name: '', description: '', trigger: '' });

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();
    setJourneys(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJourney)
    });
    setShowCreate(false);
    setNewJourney({ name: '', description: '', trigger: '' });
    fetchJourneys();
  };

  const handlePublish = async (id: string) => {
    await fetch(API_BASE + '/' + id + '/publish', { method: 'POST' });
    fetchJourneys();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journey?')) return;
    await fetch(API_BASE + '/' + id, { method: 'DELETE' });
    setSelectedJourney(null);
    fetchJourneys();
  };

  const getCompletionRate = (journey: Journey) => {
    const { triggered, completed } = journey.stats;
    return triggered > 0 ? ((completed / triggered) * 100).toFixed(1) : '0';
  };

  if (loading) return <Typography>Loading journeys...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h2">Journey & Flow Management</Typography>
        <Button variant="primary" onClick={() => setShowCreate(true)}>Create Journey</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Journey List */}
        <div>
          <Typography variant="h3" style={{ marginBottom: '12px' }}>All Journeys</Typography>
          {journeys.map(journey => (
            <Card 
              key={journey.id}
              style={{ 
                marginBottom: '8px', 
                cursor: 'pointer',
                border: selectedJourney?.id === journey.id ? '2px solid #3498db' : '1px solid #ddd'
              }}
              onClick={() => setSelectedJourney(journey)}
            >
              <Typography variant="body" style={{ fontWeight: 'bold' }}>{journey.name}</Typography>
              <Typography variant="caption">{journey.description}</Typography>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: journey.status === 'ACTIVE' ? '#e8f5e9' : '#fff3e0'
                }}>
                  {journey.status}
                </span>
                <Typography variant="caption">Trigger: {journey.trigger}</Typography>
              </div>
            </Card>
          ))}
        </div>

        {/* Journey Details */}
        <div>
          {selectedJourney ? (
            <Card>
              <Typography variant="h3">{selectedJourney.name}</Typography>
              <Typography variant="caption">{selectedJourney.description}</Typography>
              
              <div style={{ marginTop: '16px' }}>
                <Typography variant="body" style={{ fontWeight: 'bold' }}>Statistics</Typography>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <div>
                    <Typography variant="h3">{selectedJourney.stats.triggered}</Typography>
                    <Typography variant="caption">Triggered</Typography>
                  </div>
                  <div>
                    <Typography variant="h3">{selectedJourney.stats.completed}</Typography>
                    <Typography variant="caption">Completed</Typography>
                  </div>
                  <div>
                    <Typography variant="h3">{getCompletionRate(selectedJourney)}%</Typography>
                    <Typography variant="caption">Completion</Typography>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <Typography variant="body" style={{ fontWeight: 'bold' }}>Steps</Typography>
                {selectedJourney.steps.map((step: any, i: number) => (
                  <div 
                    key={step.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px'
                    }}
                  >
                    <span style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: '#3498db',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      {step.order}
                    </span>
                    <Typography variant="body">{step.type}</Typography>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {selectedJourney.status === 'DRAFT' && (
                  <Button variant="primary" onClick={() => handlePublish(selectedJourney.id)}>
                    Publish
                  </Button>
                )}
                <Button variant="danger" onClick={() => handleDelete(selectedJourney.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <Typography>Select a journey to view details</Typography>
            </Card>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Card style={{ width: '400px' }}>
            <Typography variant="h3">Create New Journey</Typography>
            <div style={{ marginTop: '16px' }}>
              <Typography variant="caption">Name</Typography>
              <input 
                type="text" 
                value={newJourney.name}
                onChange={(e) => setNewJourney({ ...newJourney, name: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <Typography variant="caption">Description</Typography>
              <textarea 
                value={newJourney.description}
                onChange={(e) => setNewJourney({ ...newJourney, description: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '60px' }}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <Typography variant="caption">Trigger Event</Typography>
              <select 
                value={newJourney.trigger}
                onChange={(e) => setNewJourney({ ...newJourney, trigger: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="">Select trigger...</option>
                <option value="USER_CREATED">User Created</option>
                <option value="USAGE_THRESHOLD">Usage Threshold</option>
                <option value="LOW_USAGE_DETECTED">Low Usage</option>
                <option value="BILLING_FAILED">Billing Failed</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Button variant="primary" onClick={handleCreate}>Create</Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
