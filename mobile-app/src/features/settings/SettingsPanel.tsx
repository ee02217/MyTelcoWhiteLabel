import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useLocalization } from '../i18n';
import { useExperiments } from '../experiment';
import { useTheme, type Theme } from '../../hooks/useTheme';
import { useAlertThresholds, usePushConsent } from './useAlerts';

type AuthedFetch = (path: string, init?: RequestInit) => Promise<Response>;

interface SettingsPanelProps {
  authedFetch?: AuthedFetch;
}

export function SettingsPanel({ authedFetch }: SettingsPanelProps) {
  const { locale, locales, changeLocale, t } = useLocalization();
  const { experiments, assignments } = useExperiments();
  const { theme, setTheme, isDark, resolvedTheme } = useTheme();
  const { config: alertConfig, loading: alertLoading, saving: alertSaving, updateThresholds } = useAlertThresholds(authedFetch || (() => Promise.resolve(new Response())));
  const { granted: pushGranted, asked: pushAsked, requestConsent, revokeConsent } = usePushConsent();
  const [activeTab, setActiveTab] = useState<'locale' | 'theme' | 'alerts' | 'experiments'>('locale');
  const [selectedThresholds, setSelectedThresholds] = useState<number[]>([50, 75, 90, 100]);

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">{t('settings')}</Typography>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Button
          variant={activeTab === 'locale' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('locale')}
        >
          Language
        </Button>
        <Button
          variant={activeTab === 'theme' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('theme')}
        >
          Theme
        </Button>
        <Button
          variant={activeTab === 'alerts' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts
        </Button>
        <Button
          variant={activeTab === 'experiments' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('experiments')}
        >
          Experiments
        </Button>
      </div>

      {/* Locale Tab */}
      {activeTab === 'locale' && (
        <div>
          <Typography variant="h3">Select Language</Typography>
          <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
            Choose your preferred language and region. This affects dates, currency, and content.
          </Typography>

          {locales.map(loc => (
            <Card 
              key={loc.code} 
              style={{ 
                marginBottom: '8px', 
                cursor: 'pointer',
                border: locale === loc.code ? '2px solid #3498db' : '1px solid #ddd',
                backgroundColor: locale === loc.code ? '#f0f8ff' : '#fff'
              }}
              onClick={() => changeLocale(loc.code)}
            >
              <Typography variant="body">{loc.nativeName}</Typography>
              <Typography variant="caption">{loc.name}</Typography>
              <Typography variant="caption">{loc.currencyCode} • {loc.dateFormat}</Typography>
            </Card>
          ))}
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div>
          <Card>
            <Typography variant="h3">Appearance</Typography>
            <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
              Choose how the app looks. Dark mode is easier on the eyes in low light.
            </Typography>

            {(['light', 'dark', 'system'] as Theme[]).map(themeOption => (
              <Card 
                key={themeOption}
                style={{ 
                  marginBottom: '8px', 
                  cursor: 'pointer',
                  border: theme === themeOption ? '2px solid #3498db' : '1px solid #ddd',
                  backgroundColor: theme === themeOption ? '#f0f8ff' : '#fff'
                }}
                onClick={() => setTheme(themeOption)}
              >
                <Typography variant="body" style={{ textTransform: 'capitalize' }}>
                  {themeOption === 'system' ? 'System Default' : themeOption}
                </Typography>
                <Typography variant="caption">
                  {themeOption === 'light' ? 'Always use light theme' :
                   themeOption === 'dark' ? 'Always use dark theme' : 
                   `Currently: ${resolvedTheme}`}
                </Typography>
              </Card>
            ))}

            <Button 
              variant="secondary" 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={{ marginTop: '8px' }}
            >
              Toggle Theme
            </Button>
          </Card>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          <Card>
            <Typography variant="h3">Push Notifications</Typography>
            <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
              Allow push notifications to receive usage alerts and updates.
            </Typography>
            
            {pushAsked ? (
              <div>
                <Typography variant="body" style={{ color: pushGranted ? '#27ae60' : '#e74c3c' }}>
                  {pushGranted ? 'Push notifications enabled' : 'Push notifications disabled'}
                </Typography>
                {pushGranted ? (
                  <Button variant="secondary" onClick={revokeConsent} style={{ marginTop: '8px' }}>
                    Disable Push
                  </Button>
                ) : (
                  <Button variant="primary" onClick={requestConsent} style={{ marginTop: '8px' }}>
                    Enable Push
                  </Button>
                )}
              </div>
            ) : (
              <Button variant="primary" onClick={requestConsent}>
                Enable Push Notifications
              </Button>
            )}
          </Card>

          <Card style={{ marginTop: '12px' }}>
            <Typography variant="h3">Usage Alert Thresholds</Typography>
            <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
              Get notified when your data usage reaches these thresholds.
            </Typography>

            {alertLoading ? (
              <Typography>Loading...</Typography>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {[25, 50, 75, 90, 100].map(threshold => (
                    <label 
                      key={threshold}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: selectedThresholds.includes(threshold) ? '#e8f5e9' : '#fff'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedThresholds.includes(threshold)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedThresholds([...selectedThresholds, threshold].sort((a, b) => a - b));
                          } else {
                            setSelectedThresholds(selectedThresholds.filter(t => t !== threshold));
                          }
                        }}
                      />
                      <Typography variant="body">{threshold}%</Typography>
                    </label>
                  ))}
                </div>
                
                <Button 
                  variant="primary" 
                  onClick={() => updateThresholds(selectedThresholds)}
                  disabled={alertSaving}
                >
                  {alertSaving ? 'Saving...' : 'Save Thresholds'}
                </Button>
                
                {alertConfig && (
                  <Typography variant="caption" style={{ marginTop: '8px', display: 'block' }}>
                    Current: {alertConfig.thresholds.join('%, ')}%
                  </Typography>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div>
          <Typography variant="h3">Active Experiments</Typography>
          <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
            You're automatically enrolled in experiments to improve your experience.
          </Typography>

          {experiments.length === 0 ? (
            <Typography>No active experiments</Typography>
          ) : (
            experiments.map(exp => {
              const assignment = assignments.find(a => a.experimentId === exp.experimentId);
              return (
                <Card key={exp.experimentId} style={{ marginBottom: '8px' }}>
                  <Typography variant="body">{exp.name}</Typography>
                  <Typography variant="caption">{exp.description}</Typography>
                  {assignment && (
                    <Typography variant="caption" style={{ marginTop: '4px', color: '#3498db' }}>
                      Your variant: <strong>{assignment.variant}</strong>
                    </Typography>
                  )}
                  <Typography variant="caption">
                    Variants: {exp.variants.join(', ')}
                  </Typography>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
