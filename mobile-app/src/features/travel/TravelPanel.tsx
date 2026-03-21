import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useTravelRecommendations, useInTripControls } from './useTravel';

export function TravelPanel() {
  const { recommendations, loading: recLoading, purchasePack } = useTravelRecommendations();
  const { usages, spendCap, loading: tripLoading, updateSpendCap, purchaseEmergencyTopup } = useInTripControls();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'usage' | 'controls'>('recommendations');
  const [topupAmount, setTopupAmount] = useState(10);
  const [topupResult, setTopupResult] = useState<string | null>(null);

  if (recLoading || tripLoading) {
    return (
      <Card>
        <Typography variant="h2">Travel & Roaming</Typography>
        <Typography>Loading...</Typography>
      </Card>
    );
  }

  const handlePurchase = async (packId: string) => {
    await purchasePack(packId);
    alert(`Pack ${packId} purchased!`);
  };

  const handleTopup = async () => {
    const result = await purchaseEmergencyTopup(topupAmount);
    if (result) {
      setTopupResult(result.message);
    }
  };

  const handleUpdateCap = async () => {
    await updateSpendCap(50, ['WARNING', 'CRITICAL']);
    alert('Spend cap updated!');
  };

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">Travel & Roaming</Typography>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['recommendations', 'usage', 'controls'] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'recommendations' ? 'Packs' : tab === 'usage' ? 'Usage' : 'Controls'}
          </Button>
        ))}
      </div>

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div>
          <Typography variant="h3">Recommended Roaming Packs</Typography>
          {recommendations.length === 0 ? (
            <Typography>No recommendations available</Typography>
          ) : (
            recommendations.map((pack, idx) => (
              <Card 
                key={idx} 
                style={{ 
                  marginBottom: '12px', 
                  borderLeft: pack.recommended ? '4px solid #27ae60' : '1px solid #ddd',
                  backgroundColor: pack.recommended ? '#f8fff8' : '#fff'
                }}
              >
                <Typography variant="body">{pack.packName}</Typography>
                <Typography variant="caption">{pack.destinationName}</Typography>
                <Typography variant="caption">
                  {pack.dataMb / 1024}GB Data • {pack.voiceMinutes}min Voice • {pack.validityDays} days
                </Typography>
                <Typography variant="h4" style={{ marginTop: '4px' }}>
                  €{pack.priceEur}
                  {pack.savingsEur > 0 && (
                    <Typography variant="caption" style={{ textDecoration: 'line-through', marginLeft: '8px' }}>
                      €{pack.payAsYouGoEur} (Save €{pack.savingsEur})
                    </Typography>
                  )}
                </Typography>
                <Button 
                  variant="primary" 
                  onClick={() => handlePurchase(pack.packId)}
                  style={{ marginTop: '8px' }}
                >
                  {pack.recommended ? 'Buy Recommended' : 'Buy'} (3 taps)
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div>
          <Typography variant="h3">Live Roaming Usage</Typography>
          {usages.length === 0 ? (
            <Typography>No roaming usage data</Typography>
          ) : (
            usages.map((usage, idx) => {
              const dataPct = (usage.dataUsedMb / usage.dataLimitMb) * 100;
              const voicePct = (usage.voiceUsedMinutes / usage.voiceLimitMinutes) * 100;
              
              return (
                <Card key={idx} style={{ marginBottom: '12px' }}>
                  <Typography variant="body">{usage.country}</Typography>
                  <Typography variant="caption">
                    Period: {usage.periodStart} to {usage.periodEnd}
                  </Typography>
                  
                  <Typography variant="caption" style={{ marginTop: '8px' }}>Data</Typography>
                  <div style={{ background: '#eee', height: '8px', borderRadius: '4px' }}>
                    <div style={{ 
                      background: dataPct > 90 ? '#e74c3c' : dataPct > 70 ? '#f39c12' : '#27ae60', 
                      width: `${Math.min(dataPct, 100)}%`, 
                      height: '100%', 
                      borderRadius: '4px' 
                    }} />
                  </div>
                  <Typography variant="caption">
                    {usage.dataUsedMb}MB / {usage.dataLimitMb}MB ({dataPct.toFixed(0)}%)
                  </Typography>

                  <Typography variant="caption" style={{ marginTop: '8px' }}>Voice</Typography>
                  <div style={{ background: '#eee', height: '8px', borderRadius: '4px' }}>
                    <div style={{ 
                      background: voicePct > 90 ? '#e74c3c' : voicePct > 70 ? '#f39c12' : '#27ae60', 
                      width: `${Math.min(voicePct, 100)}%`, 
                      height: '100%', 
                      borderRadius: '4px' 
                    }} />
                  </div>
                  <Typography variant="caption">
                    {usage.voiceUsedMinutes}min / {usage.voiceLimitMinutes}min ({voicePct.toFixed(0)}%)
                  </Typography>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Controls Tab */}
      {activeTab === 'controls' && (
        <div>
          <Typography variant="h3">Spend Controls</Typography>
          
          <Card style={{ marginBottom: '12px' }}>
            <Typography variant="body">Current Spend Cap</Typography>
            {spendCap ? (
              <>
                <Typography variant="h4">€{spendCap.limitEur}</Typography>
                <Typography variant="caption">
                  Spent: €{spendCap.spentEur} • Alerts: {spendCap.alertTriggers.join(', ')}
                </Typography>
                <Button variant="secondary" onClick={handleUpdateCap} style={{ marginTop: '8px' }}>
                  Update Cap
                </Button>
              </>
            ) : (
              <Typography>No cap set</Typography>
            )}
          </Card>

          <Card>
            <Typography variant="h3">Emergency Top-up</Typography>
            <Typography variant="caption" style={{ marginBottom: '8px', display: 'block' }}>
              Need more data while traveling? Add emergency credit.
            </Typography>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {[10, 20, 30, 50].map(amt => (
                <Button
                  key={amt}
                  variant={topupAmount === amt ? 'primary' : 'secondary'}
                  onClick={() => setTopupAmount(amt)}
                >
                  €{amt}
                </Button>
              ))}
            </div>
            <Button variant="primary" onClick={handleTopup}>
              Purchase €{topupAmount} Top-up
            </Button>
            {topupResult && (
              <Typography variant="caption" style={{ marginTop: '8px', color: '#27ae60' }}>
                {topupResult}
              </Typography>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
