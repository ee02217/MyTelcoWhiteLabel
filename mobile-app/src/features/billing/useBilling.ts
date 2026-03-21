import { useState, useEffect, useCallback } from 'react';
import { PaymentMethod, BillingAddress, AutoPayConfig, Invoice } from './types';

const API_BASE = '/api/v1/customer/billing';

export function useBilling(authedFetch: (path: string, init?: RequestInit) => Promise<Response>) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addresses, setAddresses] = useState<BillingAddress[]>([]);
  const [autoPay, setAutoPay] = useState<AutoPayConfig | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pmRes, addrRes, apRes, invRes] = await Promise.all([
        authedFetch(`${API_BASE}/payment-methods`),
        authedFetch(`${API_BASE}/addresses`),
        authedFetch(`${API_BASE}/autopay`),
        authedFetch(`${API_BASE}/invoices`),
      ]);
      setPaymentMethods(pmRes.ok ? await pmRes.json() : []);
      setAddresses(addrRes.ok ? await addrRes.json() : []);
      setAutoPay(apRes.ok ? await apRes.json() : null);
      setInvoices(invRes.ok ? await invRes.json() : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Payment Methods
  const addPaymentMethod = async (data: {
    cardLast4: string;
    cardBrand: string;
    expiryMonth: string;
    expiryYear: string;
    cardHolder: string;
  }) => {
    try {
      setSaving(true);
      const res = await authedFetch(`${API_BASE}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add');
      const method = await res.json();
      setPaymentMethods(prev => [...prev, method]);
      return method;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deletePaymentMethod = async (paymentMethodId: string) => {
    try {
      const res = await authedFetch(`${API_BASE}/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
      });
      if (!res.ok) return false;
      setPaymentMethods(prev => prev.filter(pm => pm.paymentMethodId !== paymentMethodId));
      return true;
    } catch {
      return false;
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const res = await authedFetch(`${API_BASE}/payment-methods/${paymentMethodId}/default`, {
        method: 'PUT',
      });
      if (!res.ok) return null;
      const updated = await res.json();
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        isDefault: pm.paymentMethodId === paymentMethodId,
      })));
      return updated;
    } catch {
      return null;
    }
  };

  // Addresses
  const addAddress = async (data: {
    lineId?: string;
    type?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => {
    try {
      setSaving(true);
      const res = await authedFetch(`${API_BASE}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add');
      const addr = await res.json();
      setAddresses(prev => [...prev, addr]);
      return addr;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const res = await authedFetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'DELETE',
      });
      if (!res.ok) return false;
      setAddresses(prev => prev.filter(a => a.addressId !== addressId));
      return true;
    } catch {
      return false;
    }
  };

  // Auto-Pay
  const updateAutoPay = async (enabled: boolean, paymentMethodId?: string, scheduleDay?: string) => {
    try {
      setSaving(true);
      const res = await authedFetch(`${API_BASE}/autopay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, paymentMethodId, scheduleDay }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const config = await res.json();
      setAutoPay(config);
      return config;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Invoice download
  const downloadInvoice = async (invoiceId: string) => {
    try {
      const res = await authedFetch(`/api/v1/customer/payments/receipt/${invoiceId}/download`);
      if (!res.ok) throw new Error('Failed to download');
      return res.blob();
    } catch {
      return null;
    }
  };

  return {
    paymentMethods,
    addresses,
    autoPay,
    invoices,
    loading,
    saving,
    error,
    refetch: fetchAll,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    addAddress,
    deleteAddress,
    updateAutoPay,
    downloadInvoice,
  };
}
