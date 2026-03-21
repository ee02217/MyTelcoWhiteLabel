import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useLocalization } from '../i18n';
import { useExperiments } from '../experiment';

export function SettingsPanel() {
  const { locale, locales, changeLocale, t } = useLocalization();
  const { experiments, assignments } = useExperiments();
  const [activeTab, setActiveTab] = useState<'locale' | 'experiments'>('locale');

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">{t('settings')}</Typography>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button
          variant={activeTab === 'locale' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('locale')}
        >
          Language
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
