import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useProfile } from './useProfile';
import { NotificationPreferences } from './types';

type AuthedFetch = (path: string, init?: RequestInit) => Promise<Response>;

interface ProfilePanelProps {
  authedFetch: AuthedFetch;
}

export function ProfilePanel({ authedFetch }: ProfilePanelProps) {
  const { 
    profile, 
    loading, 
    saving, 
    error, 
    updateProfile, 
    updateNotificationPrefs,
    revokeSession,
    exportData,
    deleteAccount 
  } = useProfile(authedFetch);

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'sessions' | 'privacy'>('profile');
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    pushEnabled: true,
    smsEnabled: true,
    emailEnabled: true,
    marketingEmails: false,
  });

  // Load profile data into form
  useState(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
      });
      setNotifPrefs(profile.notificationPrefs);
    }
  });

  if (loading) {
    return (
      <Card>
        <Typography variant="h2">Profile</Typography>
        <Typography>Loading...</Typography>
      </Card>
    );
  }

  const handleSave = async () => {
    await updateProfile(formData);
    setEditMode(false);
  };

  const handleNotifSave = async () => {
    await updateNotificationPrefs(notifPrefs);
  };

  const handleExport = async () => {
    const data = await exportData();
    if (data) {
      alert('Data exported: ' + JSON.stringify(data, null, 2));
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      const success = await deleteAccount();
      if (success) {
        alert('Account deletion scheduled. You will be logged out.');
      }
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">Account</Typography>
      
      {error && (
        <Typography color="error" style={{ marginBottom: '8px' }}>{error}</Typography>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['profile', 'notifications', 'sessions', 'privacy'] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'profile' ? 'Profile' : 
             tab === 'notifications' ? 'Notifs' : 
             tab === 'sessions' ? 'Sessions' : 'Privacy'}
          </Button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <div>
          <Card>
            <Typography variant="h3">Personal Details</Typography>
            
            <div style={{ marginBottom: '12px' }}>
              <Typography variant="caption">First Name</Typography>
              <input
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: editMode ? '#fff' : '#f5f5f5'
                }}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!editMode}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Typography variant="caption">Last Name</Typography>
              <input
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: editMode ? '#fff' : '#f5f5f5'
                }}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!editMode}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Typography variant="caption">Email</Typography>
              <input
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: editMode ? '#fff' : '#f5f5f5'
                }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!editMode}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Typography variant="caption">Phone</Typography>
              <input
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: editMode ? '#fff' : '#f5f5f5'
                }}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editMode}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {editMode ? (
                <>
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="secondary" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
            </div>
          </Card>

          <Card style={{ marginTop: '12px' }}>
            <Typography variant="h3">Account Info</Typography>
            <Typography variant="caption">Customer ID: {profile.customerId}</Typography>
            <Typography variant="caption">Language: {profile.preferredLanguage}</Typography>
            <Typography variant="caption">Member since: {new Date(profile.createdAt).toLocaleDateString()}</Typography>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          <Card>
            <Typography variant="h3">Notification Preferences</Typography>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={notifPrefs.pushEnabled}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, pushEnabled: e.target.checked })}
                />
                <Typography variant="body">Push Notifications</Typography>
              </label>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={notifPrefs.smsEnabled}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, smsEnabled: e.target.checked })}
                />
                <Typography variant="body">SMS Notifications</Typography>
              </label>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={notifPrefs.emailEnabled}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, emailEnabled: e.target.checked })}
                />
                <Typography variant="body">Email Notifications</Typography>
              </label>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={notifPrefs.marketingEmails}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, marketingEmails: e.target.checked })}
                />
                <Typography variant="body">Marketing Emails</Typography>
              </label>
            </div>

            <Button variant="primary" onClick={handleNotifSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Card>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && profile && (
        <div>
          <Card>
            <Typography variant="h3">Active Sessions</Typography>
            
            {profile.sessions.length === 0 ? (
              <Typography>No active sessions</Typography>
            ) : (
              profile.sessions.map((session) => (
                <Card 
                  key={session.sessionId} 
                  style={{ 
                    marginTop: '8px', 
                    padding: '8px',
                    borderLeft: session.currentSession ? '3px solid #27ae60' : '1px solid #ddd'
                  }}
                >
                  <Typography variant="body">
                    {session.deviceName} ({session.deviceType})
                  </Typography>
                  <Typography variant="caption">IP: {session.ipAddress}</Typography>
                  <Typography variant="caption">
                    Last active: {new Date(session.lastActive).toLocaleString()}
                  </Typography>
                  {session.currentSession && (
                    <Typography variant="caption" style={{ color: '#27ae60' }}>Current session</Typography>
                  )}
                  {!session.currentSession && (
                    <Button 
                      variant="danger" 
                      onClick={() => revokeSession(session.sessionId)}
                      style={{ marginTop: '4px' }}
                    >
                      Log out
                    </Button>
                  )}
                </Card>
              ))
            )}
          </Card>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div>
          <Card>
            <Typography variant="h3">Data & Privacy</Typography>
            
            <Button variant="secondary" onClick={handleExport} style={{ marginBottom: '8px' }}>
              Export My Data
            </Button>
            <Typography variant="caption">
              Download a copy of all your account data.
            </Typography>
          </Card>

          <Card style={{ marginTop: '12px', borderColor: '#e74c3c' }}>
            <Typography variant="h3" style={{ color: '#e74c3c' }}>Danger Zone</Typography>
            <Typography variant="caption" style={{ marginBottom: '8px', display: 'block' }}>
              Once you delete your account, there is no going back. Please be certain.
            </Typography>
            <Button variant="danger" onClick={handleDelete}>
              Delete My Account
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
