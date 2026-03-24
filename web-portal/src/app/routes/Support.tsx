import { useEffect, useState } from 'react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  PlusIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { SupportCase, SupportCaseDetail, TimelineEvent } from '../../types/api';

const FALLBACK_CASES: SupportCase[] = [
  {
    caseId: 'case-001',
    status: 'OPEN',
    priority: 'HIGH',
    category: 'BILLING',
    subject: 'Incorrect charge on last invoice',
    createdAt: '2026-03-20T10:30:00Z',
    updatedAt: '2026-03-20T10:30:00Z',
  },
  {
    caseId: 'case-002',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'TECHNICAL',
    subject: 'Slow data speeds in Lisbon area',
    createdAt: '2026-03-18T14:15:00Z',
    updatedAt: '2026-03-19T09:00:00Z',
  },
  {
    caseId: 'case-003',
    status: 'RESOLVED',
    priority: 'LOW',
    category: 'GENERAL',
    subject: 'Request for plan upgrade information',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-12T16:30:00Z',
  },
  {
    caseId: 'case-004',
    status: 'WAITING_CUSTOMER',
    priority: 'MEDIUM',
    category: 'BILLING',
    subject: 'Payment method update required',
    createdAt: '2026-03-15T11:00:00Z',
    updatedAt: '2026-03-17T13:45:00Z',
  },
];

const FALLBACK_DETAIL: SupportCaseDetail = {
  ...FALLBACK_CASES[0],
  description: 'I noticed an extra charge of 15.00 EUR on my February invoice that I do not recognize.',
  timeline: [
    {
      eventId: 'evt-1',
      timestamp: '2026-03-20T10:30:00Z',
      type: 'MESSAGE',
      message: 'Case opened by customer.',
      author: 'Customer',
    },
    {
      eventId: 'evt-2',
      timestamp: '2026-03-20T11:00:00Z',
      type: 'STATUS_CHANGE',
      message: 'Case assigned to billing team.',
      author: 'System',
    },
    {
      eventId: 'evt-3',
      timestamp: '2026-03-20T14:00:00Z',
      type: 'MESSAGE',
      message: 'We are reviewing your invoice. We will get back to you within 24 hours.',
      author: 'Support Agent',
    },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'badge-info',
  IN_PROGRESS: 'badge-warning',
  WAITING_CUSTOMER: 'badge-purple',
  RESOLVED: 'badge-success',
  CLOSED: 'badge-neutral',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_CUSTOMER: 'Waiting on You',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

interface SupportProps {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export function Support({ authedFetch }: SupportProps) {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<SupportCaseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Create form state
  const [formCategory, setFormCategory] = useState('BILLING');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = () => {
    setLoading(true);
    authedFetch('/api/v1/customer/support/cases')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setCases(Array.isArray(data) ? data : FALLBACK_CASES))
      .catch(() => setCases(FALLBACK_CASES))
      .finally(() => setLoading(false));
  };

  const loadCaseDetail = (caseId: string) => {
    setLoadingDetail(true);
    authedFetch(`/api/v1/customer/support/cases/${caseId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setSelectedCase)
      .catch(() => {
        // Use fallback matching the case or the generic fallback
        const fallback = FALLBACK_CASES.find((c) => c.caseId === caseId);
        setSelectedCase({
          ...(fallback || FALLBACK_CASES[0]),
          description: 'Case details could not be loaded.',
          timeline: FALLBACK_DETAIL.timeline,
        });
      })
      .finally(() => setLoadingDetail(false));
  };

  const handleCreateCase = async () => {
    setCreating(true);
    try {
      const response = await authedFetch('/api/v1/customer/support/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formCategory,
          subject: formSubject,
          description: formDescription,
          priority: formPriority,
        }),
      });
      if (response.ok) {
        const newCase = await response.json();
        setCases((prev) => [newCase, ...prev]);
      }
    } catch {
      // Add mock case
      const mockCase: SupportCase = {
        caseId: `case-${Date.now()}`,
        status: 'OPEN',
        priority: formPriority as SupportCase['priority'],
        category: formCategory,
        subject: formSubject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCases((prev) => [mockCase, ...prev]);
    }
    setShowCreateDialog(false);
    setFormSubject('');
    setFormDescription('');
    setCreating(false);
  };

  const handleSendMessage = async () => {
    if (!selectedCase || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await authedFetch(`/api/v1/customer/support/cases/${selectedCase.caseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });
    } catch {
      // ignore
    }
    const newEvent: TimelineEvent = {
      eventId: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'MESSAGE',
      message: newMessage,
      author: 'Customer',
    };
    setSelectedCase({
      ...selectedCase,
      timeline: [...selectedCase.timeline, newEvent],
    });
    setNewMessage('');
    setSendingMessage(false);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Case detail view
  if (selectedCase) {
    return (
      <div className="page">
        <button
          className="btn-ghost self-start"
          onClick={() => setSelectedCase(null)}
          style={{ padding: '6px 12px', gap: '6px' }}
        >
          <ArrowLeftIcon style={{ width: 18, height: 18 }} />
          Back to Cases
        </button>

        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">{selectedCase.subject}</h1>
              <div className="row mt-2" style={{ gap: '8px' }}>
                <span className={`badge ${STATUS_COLORS[selectedCase.status]}`}>
                  {STATUS_LABELS[selectedCase.status]}
                </span>
                <span className="badge badge-neutral">{selectedCase.category}</span>
                <span className="text-sm text-secondary">
                  Opened {formatDate(selectedCase.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {selectedCase.description && (
          <div className="card">
            <h2 className="text-base text-semibold mb-2">Description</h2>
            <p className="text-sm text-secondary">{selectedCase.description}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="card">
          <h2 className="text-base text-semibold mb-4">Timeline</h2>
          <div className="stack" style={{ gap: '16px' }}>
            {selectedCase.timeline.map((event) => (
              <div
                key={event.eventId}
                style={{
                  display: 'flex',
                  gap: '12px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--premium-border)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-full)',
                    background: event.type === 'MESSAGE' ? '#eff6ff' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {event.type === 'MESSAGE' ? (
                    <ChatBubbleLeftRightIcon style={{ width: 16, height: 16, color: 'var(--premium-info)' }} />
                  ) : (
                    <ClockIcon style={{ width: 16, height: 16, color: 'var(--premium-text-muted)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="row-between">
                    <span className="text-sm text-semibold">{event.author}</span>
                    <span className="text-xs text-muted">{formatDateTime(event.timestamp)}</span>
                  </div>
                  <p className="text-sm text-secondary mt-1">{event.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Message */}
          <div className="mt-4" style={{ paddingTop: '16px', borderTop: '1px solid var(--premium-border)' }}>
            <label className="text-sm text-semibold mb-2" style={{ display: 'block' }}>Add a Message</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="form-input"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <button
              className="btn-primary mt-3"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case list view
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Support</h1>
            <p className="page-subtitle">Manage your support cases</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateDialog(true)}>
            <PlusIcon style={{ width: 20, height: 20 }} />
            Create New Case
          </button>
        </div>
      </div>

      {loading && (
        <div className="stack-gap">
          <LoadingSkeleton height="80px" />
          <LoadingSkeleton height="80px" />
          <LoadingSkeleton height="80px" />
        </div>
      )}

      {!loading && cases.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <ChatBubbleLeftRightIcon style={{ width: 48, height: 48, color: 'var(--premium-text-muted)', margin: '0 auto 16px' }} />
          <p className="text-lg text-semibold">No support cases</p>
          <p className="text-sm text-secondary mt-2">You have no support cases yet. Create one if you need help.</p>
        </div>
      )}

      {!loading && cases.length > 0 && (
        <div className="stack-gap">
          {cases.map((c) => (
            <div
              key={c.caseId}
              className="card card-hover"
              onClick={() => loadCaseDetail(c.caseId)}
              style={{ cursor: 'pointer' }}
            >
              <div className="row-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="text-base text-semibold">{c.subject}</h3>
                  <div className="row mt-2" style={{ gap: '8px' }}>
                    <span className={`badge ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                    <span className="badge badge-neutral">{c.category}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="text-sm text-secondary">{formatDate(c.createdAt)}</p>
                  <p className="text-xs text-muted mt-1">Priority: {c.priority}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loadingDetail && (
        <div className="dialog-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <p className="text-sm text-secondary">Loading case details...</p>
          </div>
        </div>
      )}

      {/* Create Case Dialog */}
      <ConfirmDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={handleCreateCase}
        title="Create New Case"
        confirmText={creating ? 'Creating...' : 'Create Case'}
        confirmDisabled={creating || !formSubject.trim() || !formDescription.trim()}
        loading={creating}
      >
        <div className="stack" style={{ gap: '16px' }}>
          <div>
            <label className="form-label">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="BILLING">Billing</option>
              <option value="TECHNICAL">Technical</option>
              <option value="OUTAGE">Outage</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              className="form-input"
              placeholder="Brief summary of your issue"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="form-input"
              rows={4}
              placeholder="Describe your issue in detail"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value)}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
