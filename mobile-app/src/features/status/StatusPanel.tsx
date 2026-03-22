import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useServiceStatus, useIncidentNotifications } from './useServiceStatus';
import { Incident, IncidentUpdate } from './types';

const serviceLabels: Record<string, string> = {
  MOBILE_DATA: 'Mobile Data',
  VOICE_CALLS: 'Voice Calls',
  SMS: 'SMS',
  ROAMING: 'Roaming',
  BILLING: 'Billing',
  CUSTOMER_SUPPORT: 'Support',
};

const severityColors: Record<string, string> = {
  OK: '#27ae60',
  OPERATIONAL: '#27ae60',
  DEGRADED: '#f39c12',
  WARNING: '#f39c12',
  OUTAGE: '#e74c3c',
  CRITICAL: '#e74c3c',
  MAINTENANCE: '#3498db',
};

export function StatusPanel() {
  const { regions, incidents, health, loading, error, refetch, getIncidentTimeline } = useServiceStatus();
  const { preferences, fetchPreferences, createPreference, deletePreference } = useIncidentNotifications();
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'notifications'>('overview');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<IncidentUpdate[]>([]);

  if (loading) {
    return (
      <Card>
        <Typography variant="h2">Service Status</Typography>
        <Typography>Loading...</Typography>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Typography variant="h2">Service Status</Typography>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={refetch}>Retry</Button>
      </Card>
    );
  }

  const handleViewTimeline = async (incident: Incident) => {
    setSelectedIncident(incident);
    const updates = await getIncidentTimeline(incident.incidentId);
    setTimeline(updates);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">Service Status</Typography>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['overview', 'incidents', 'notifications'] as const).map(tab => (
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
          <Typography variant="h3">Service Health</Typography>
          {Object.entries(health).map(([service, status]) => (
            <Card key={service} style={{ marginBottom: '8px', borderLeft: `4px solid ${severityColors[status] || '#999'}` }}>
              <Typography variant="body">{serviceLabels[service] || service}</Typography>
              <Typography variant="caption" color={status === 'OPERATIONAL' ? 'success' : 'error'}>
                {status}
              </Typography>
            </Card>
          ))}

          <Typography variant="h3" style={{ marginTop: '16px' }}>Regional Status</Typography>
          {regions.slice(0, 6).map((region, idx) => (
            <Card key={idx} style={{ marginBottom: '4px', padding: '8px' }}>
              <Typography variant="caption">{region.regionName} - {serviceLabels[region.serviceType]}</Typography>
              <Typography variant="caption" color={region.status === 'OPERATIONAL' ? 'success' : 'error'}>
                {region.status}
              </Typography>
            </Card>
          ))}
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div>
          <Typography variant="h3">Active Incidents</Typography>
          {incidents.length === 0 ? (
            <Typography>No active incidents</Typography>
          ) : (
            incidents.map(incident => (
              <Card key={incident.incidentId} style={{ 
                marginBottom: '8px', 
                borderLeft: `4px solid ${severityColors[incident.severity] || '#999'}` 
              }}>
                <Typography variant="body">{incident.title}</Typography>
                <Typography variant="caption">{serviceLabels[incident.serviceType]}</Typography>
                <Typography variant="caption">{incident.status} - {incident.regionCode}</Typography>
                <Typography variant="caption">{incident.currentUpdate}</Typography>
                <Button variant="secondary" onClick={() => handleViewTimeline(incident)} style={{ marginTop: '4px' }}>
                  View Timeline
                </Button>
              </Card>
            ))
          )}

          {selectedIncident && timeline.length > 0 && (
            <Card style={{ marginTop: '16px', backgroundColor: '#f5f5f5' }}>
              <Typography variant="h4">Timeline: {selectedIncident.incidentId}</Typography>
              {timeline.map((update, idx) => (
                <Card key={idx} style={{ marginTop: '4px', padding: '8px' }}>
                  <Typography variant="caption">{new Date(update.timestamp).toLocaleString()}</Typography>
                  <Typography variant="caption">{update.status}: {update.message}</Typography>
                </Card>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          <Typography variant="h3">Incident Notifications</Typography>
          <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
            Opt-in to receive notifications for incidents in your region.
          </Typography>

          <Card>
            <Typography variant="body">Notification Preferences</Typography>
            <Typography variant="caption">
              {preferences.length === 0 ? 'No preferences set' : `${preferences.length} preferences configured`}
            </Typography>
            
            {preferences.map(pref => (
              <Card key={pref.preferenceId} style={{ marginTop: '8px', padding: '8px' }}>
                <Typography variant="caption">
                  {pref.regionCode} - {serviceLabels[pref.serviceType]}
                </Typography>
                <Typography variant="caption">
                  On: {pref.notifyOnStart ? 'Start ' : ''}{pref.notifyOnUpdate ? 'Update ' : ''}{pref.notifyOnResolved ? 'Resolved' : ''}
                </Typography>
                <Button variant="danger" onClick={() => deletePreference(pref.preferenceId)} style={{ marginTop: '4px' }}>
                  Remove
                </Button>
              </Card>
            ))}
          </Card>

          <Button 
            variant="primary" 
            onClick={() => createPreference({
              lineId: 'line-1',
              regionCode: 'PT-CENTRAL',
              serviceType: 'MOBILE_DATA',
              notifyOnStart: true,
              notifyOnUpdate: true,
              notifyOnResolved: true,
            })}
            style={{ marginTop: '12px' }}
          >
            Add Preference (Demo)
          </Button>
        </div>
      )}
    </div>
  );
}
