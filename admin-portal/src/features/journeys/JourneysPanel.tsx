import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Typography, Button, Modal } from '../../design-system';
import {
  fetchJourneys,
  createJourney,
  publishJourney,
  deleteJourney,
  useMockData,
} from '../../services/api-client';

interface JourneyStep {
  id: string;
  type: string;
  order: number;
}

interface Journey {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED';
  trigger: string;
  steps: JourneyStep[];
  stats: { triggered: number; completed: number; abandoned: number };
}

const MOCK_JOURNEYS: Journey[] = [
  {
    id: '1', name: 'Welcome Series', description: 'Onboard new users', status: 'ACTIVE', trigger: 'USER_CREATED',
    steps: [
      { id: 's1', type: 'WELCOME_EMAIL', order: 1 }, { id: 's2', type: 'SMS_VERIFICATION', order: 2 },
      { id: 's3', type: 'PLAN_SELECTION', order: 3 }, { id: 's4', type: 'PAYMENT_SETUP', order: 4 },
    ],
    stats: { triggered: 1250, completed: 1100, abandoned: 150 },
  },
  {
    id: '2', name: 'Churn Prevention', description: 'Win back at-risk customers', status: 'ACTIVE', trigger: 'LOW_USAGE_DETECTED',
    steps: [
      { id: 's1', type: 'USAGE_INSIGHT', order: 1 }, { id: 's2', type: 'RETENTION_OFFER', order: 2 }, { id: 's3', type: 'SURVEY', order: 3 },
    ],
    stats: { triggered: 89, completed: 45, abandoned: 44 },
  },
  {
    id: '3', name: 'Plan Upgrade', description: 'Promote premium plans', status: 'DRAFT', trigger: 'USAGE_THRESHOLD',
    steps: [
      { id: 's1', type: 'USAGE_INSIGHT', order: 1 }, { id: 's2', type: 'PLAN_COMPARISON', order: 2 },
      { id: 's3', type: 'OFFER_PRESENTATION', order: 3 }, { id: 's4', type: 'CHECKOUT', order: 4 },
    ],
    stats: { triggered: 0, completed: 0, abandoned: 0 },
  },
];

export function JourneysPanel() {
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newJourney, setNewJourney] = useState({ name: '', description: '', trigger: '' });
  const isMock = useMockData();
  const queryClient = useQueryClient();

  const { data: journeys = [], isLoading } = useQuery<Journey[]>({
    queryKey: ['admin', 'journeys'],
    queryFn: () => (isMock ? Promise.resolve(MOCK_JOURNEYS) : fetchJourneys()),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description: string; trigger: string }) =>
      isMock ? Promise.resolve({}) : createJourney(payload),
    onSuccess: () => {
      setShowCreate(false);
      setNewJourney({ name: '', description: '', trigger: '' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'journeys'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => (isMock ? Promise.resolve({}) : publishJourney(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'journeys'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => (isMock ? Promise.resolve({}) : deleteJourney(id)),
    onSuccess: () => {
      setSelectedJourney(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'journeys'] });
    },
  });

  const getCompletionRate = (journey: Journey) => {
    const { triggered, completed } = journey.stats;
    return triggered > 0 ? ((completed / triggered) * 100).toFixed(1) : '0';
  };

  if (isLoading) return <Typography>Loading journeys...</Typography>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography variant="h2">Journey & Flow Management</Typography>
        <Button variant="primary" onClick={() => setShowCreate(true)}>Create Journey</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <Typography variant="h3" style={{ marginBottom: '12px' }}>All Journeys</Typography>
          {journeys.map((journey) => (
            <Card
              key={journey.id}
              style={{
                marginBottom: '8px',
                cursor: 'pointer',
                border: selectedJourney?.id === journey.id ? '2px solid #3498db' : '1px solid #ddd',
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
                  backgroundColor: journey.status === 'ACTIVE' ? '#e8f5e9' : '#fff3e0',
                }}>
                  {journey.status}
                </span>
                <Typography variant="caption">Trigger: {journey.trigger}</Typography>
              </div>
            </Card>
          ))}
        </div>

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
                {selectedJourney.steps.map((step) => (
                  <div
                    key={step.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: '#3498db', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                    }}>
                      {step.order}
                    </span>
                    <Typography variant="body">{step.type}</Typography>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {selectedJourney.status === 'DRAFT' && (
                  <Button variant="primary" onClick={() => publishMutation.mutate(selectedJourney.id)}>
                    Publish
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Delete this journey?')) {
                      deleteMutation.mutate(selectedJourney.id);
                    }
                  }}
                >
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Journey">
        <Typography variant="h3">Create New Journey</Typography>
        <div style={{ marginTop: '16px' }}>
          <Typography variant="caption">Name</Typography>
          <input
            type="text"
            value={newJourney.name}
            onChange={(e) => setNewJourney({ ...newJourney, name: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            aria-label="Journey name"
          />
        </div>
        <div style={{ marginTop: '12px' }}>
          <Typography variant="caption">Description</Typography>
          <textarea
            value={newJourney.description}
            onChange={(e) => setNewJourney({ ...newJourney, description: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '60px' }}
            aria-label="Journey description"
          />
        </div>
        <div style={{ marginTop: '12px' }}>
          <Typography variant="caption">Trigger Event</Typography>
          <select
            value={newJourney.trigger}
            onChange={(e) => setNewJourney({ ...newJourney, trigger: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            aria-label="Trigger event"
          >
            <option value="">Select trigger...</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USAGE_THRESHOLD">Usage Threshold</option>
            <option value="LOW_USAGE_DETECTED">Low Usage</option>
            <option value="BILLING_FAILED">Billing Failed</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <Button variant="primary" onClick={() => createMutation.mutate(newJourney)}>Create</Button>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
