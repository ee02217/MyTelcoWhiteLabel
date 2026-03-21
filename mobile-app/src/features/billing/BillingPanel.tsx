import { useState } from 'react';
import { Card, Typography, Button } from '../../design-system';
import { useBilling } from './useBilling';

type AuthedFetch = (path: string, init?: RequestInit) => Promise<Response>;

interface BillingPanelProps {
  authedFetch: AuthedFetch;
}

export function BillingPanel({ authedFetch }: BillingPanelProps) {
  const {
    paymentMethods,
    addresses,
    autoPay,
    invoices,
    loading,
    saving,
    error,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    addAddress,
    deleteAddress,
    updateAutoPay,
    downloadInvoice,
  } = useBilling(authedFetch);

  const [activeTab, setActiveTab] = useState<'methods' | 'addresses' | 'autopay' | 'invoices'>('methods');

  if (loading) {
    return (
      <Card>
        <Typography variant="h2">Billing</Typography>
        <Typography>Loading...</Typography>
      </Card>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <Typography variant="h2">Billing</Typography>
      
      {error && <Typography color="error" style={{ marginBottom: '8px' }}>{error}</Typography>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['methods', 'addresses', 'autopay', 'invoices'] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'methods' ? 'Cards' : 
             tab === 'addresses' ? 'Address' : 
             tab === 'autopay' ? 'Auto-Pay' : 'Invoices'}
          </Button>
        ))}
      </div>

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div>
          <Card>
            <Typography variant="h3">Payment Methods</Typography>
            
            {paymentMethods.length === 0 ? (
              <Typography>No payment methods saved</Typography>
            ) : (
              paymentMethods.map(pm => (
                <Card key={pm.paymentMethodId} style={{ 
                  marginTop: '8px', 
                  borderLeft: pm.isDefault ? '3px solid #27ae60' : '1px solid #ddd' 
                }}>
                  <Typography variant="body">{pm.cardBrand} •••• {pm.cardLast4}</Typography>
                  <Typography variant="caption">Expires {pm.expiryMonth}/{pm.expiryYear}</Typography>
                  {pm.isDefault && (
                    <Typography variant="caption" style={{ color: '#27ae60' }}>Default</Typography>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {!pm.isDefault && (
                      <Button variant="secondary" onClick={() => setDefaultPaymentMethod(pm.paymentMethodId)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => deletePaymentMethod(pm.paymentMethodId)}>
                      Remove
                    </Button>
                  </div>
                </Card>
              ))
            )}

            {/* Add new card form (simplified) */}
            <Card style={{ marginTop: '12px', backgroundColor: '#f9f9f9' }}>
              <Typography variant="body" style={{ marginBottom: '8px' }}>Add New Card</Typography>
              <Button 
                variant="primary" 
                onClick={() => addPaymentMethod({
                  cardLast4: '1234',
                  cardBrand: 'VISA',
                  expiryMonth: '12',
                  expiryYear: '2028',
                  cardHolder: 'Test User'
                })}
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add Card (Demo)'}
              </Button>
            </Card>
          </Card>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div>
          <Card>
            <Typography variant="h3">Billing Addresses</Typography>
            
            {addresses.length === 0 ? (
              <Typography>No billing addresses saved</Typography>
            ) : (
              addresses.map(addr => (
                <Card key={addr.addressId} style={{ marginTop: '8px' }}>
                  <Typography variant="body">{addr.street}</Typography>
                  <Typography variant="caption">{addr.city}, {addr.state} {addr.postalCode}</Typography>
                  <Typography variant="caption">{addr.country}</Typography>
                  {addr.isDefault && (
                    <Typography variant="caption" style={{ color: '#27ae60' }}>Default</Typography>
                  )}
                  <Button 
                    variant="danger" 
                    onClick={() => deleteAddress(addr.addressId)}
                    style={{ marginTop: '8px' }}
                  >
                    Remove
                  </Button>
                </Card>
              ))
            )}

            <Card style={{ marginTop: '12px', backgroundColor: '#f9f9f9' }}>
              <Typography variant="body" style={{ marginBottom: '8px' }}>Add Address</Typography>
              <Button 
                variant="primary" 
                onClick={() => addAddress({
                  street: '456 New St',
                  city: 'Porto',
                  state: 'Porto',
                  postalCode: '4000-001',
                  country: 'PT'
                })}
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add Address (Demo)'}
              </Button>
            </Card>
          </Card>
        </div>
      )}

      {/* Auto-Pay Tab */}
      {activeTab === 'autopay' && (
        <div>
          <Card>
            <Typography variant="h3">Auto-Pay</Typography>
            <Typography variant="caption" style={{ marginBottom: '12px', display: 'block' }}>
              Automatically pay your bill on a specific day each month.
            </Typography>

            {autoPay ? (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={autoPay.enabled}
                      onChange={(e) => updateAutoPay(e.target.checked, autoPay.paymentMethodId || undefined, autoPay.scheduleDay || undefined)}
                      disabled={saving}
                    />
                    <Typography variant="body">Enable Auto-Pay</Typography>
                  </label>
                </div>

                {autoPay.enabled && (
                  <>
                    <Typography variant="caption">Payment Day of Month</Typography>
                    <select 
                      style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                      value={autoPay.scheduleDay || '15'}
                      onChange={(e) => updateAutoPay(true, autoPay.paymentMethodId || undefined, e.target.value)}
                    >
                      {[1,5,10,15,20,25].map(day => (
                        <option key={day} value={day}>{day}th of each month</option>
                      ))}
                    </select>

                    <Typography variant="caption">
                      Paying with: {paymentMethods.find(pm => pm.paymentMethodId === autoPay.paymentMethodId)?.cardBrand} •••• {paymentMethods.find(pm => pm.paymentMethodId === autoPay.paymentMethodId)?.cardLast4}
                    </Typography>
                  </>
                )}
              </>
            ) : (
              <Typography>Loading...</Typography>
            )}
          </Card>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div>
          <Card>
            <Typography variant="h3">Invoices</Typography>
            
            {invoices.length === 0 ? (
              <Typography>No invoices found</Typography>
            ) : (
              invoices.map(inv => (
                <Card key={inv.invoiceId} style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body">{inv.invoiceNumber}</Typography>
                    <Typography variant="body" style={{ fontWeight: 'bold' }}>
                      {inv.currency} {inv.amount.toFixed(2)}
                    </Typography>
                  </div>
                  <Typography variant="caption">
                    {inv.periodStart} to {inv.periodEnd}
                  </Typography>
                  <Typography variant="caption" style={{ 
                    color: inv.status === 'PAID' ? '#27ae60' : inv.status === 'OVERDUE' ? '#e74c3c' : '#f39c12' 
                  }}>
                    {inv.status} • Due: {inv.dueDate}
                  </Typography>
                  <Button 
                    variant="secondary" 
                    onClick={() => downloadInvoice(inv.invoiceId)}
                    style={{ marginTop: '8px' }}
                  >
                    Download PDF
                  </Button>
                </Card>
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
