import { useState, useEffect, memo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { claimApi, invoiceApi } from '../api/api.js';
import { TableSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  FileText, CheckCircle2, XCircle, AlertCircle,
  Banknote, Clock, ShieldCheck, Download, Loader2,
  FileDown, RefreshCw, Calendar, ChevronDown, Circle
} from 'lucide-react';

// Claim Status Timeline component
function ClaimTimeline({ claim }) {
  const steps = [
    { key: 'triggered', label: 'Triggered', icon: <AlertCircle size={12} />, date: claim.triggeredAt },
    { key: 'risk', label: 'Risk Assessed', icon: <ShieldCheck size={12} />, date: claim.triggeredAt },
    { key: 'fraud', label: 'Fraud Check', icon: claim.fraudCheckPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />, date: claim.triggeredAt },
    { key: 'status', label: claim.status === 'APPROVED' || claim.status === 'PAID' ? 'Approved' : claim.status === 'REJECTED' ? 'Rejected' : 'Pending', icon: <Circle size={12} />, date: claim.processedAt || null },
    ...(claim.payoutAmount ? [{ key: 'payout', label: 'Payout Sent', icon: <Banknote size={12} />, date: claim.payoutDate || claim.processedAt }] : []),
  ];

  const currentStep = claim.status === 'PENDING' ? 2 : claim.status === 'REJECTED' ? 3 : claim.payoutAmount ? 4 : 3;

  return (
    <div className="claim-timeline" role="list" aria-label="Claim progress timeline">
      {steps.map((step, idx) => {
        const isCompleted = idx <= currentStep;
        const isCurrent = idx === currentStep;
        const isFailed = step.key === 'fraud' && !claim.fraudCheckPassed;
        return (
          <div key={step.key} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFailed ? 'failed' : ''}`} role="listitem">
            <div className="timeline-dot" aria-hidden="true">
              {step.icon}
            </div>
            {idx < steps.length - 1 && <div className={`timeline-line ${isCompleted ? 'completed' : ''}`} aria-hidden="true" />}
            <div className="timeline-label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}

const DATE_RANGES = [
  { key: '7d', label: 'Last 7 Days', days: 7 },
  { key: '30d', label: 'Last 30 Days', days: 30 },
  { key: '90d', label: 'Last 90 Days', days: 90 },
  { key: 'all', label: 'All Time', days: null },
];


function SettlementModal({ claim, worker, onClose }) {
  if (!claim) return null;
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#000000', maxWidth: '500px', width: '100%', padding: '32px', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '1.5rem', fontWeight: 800 }}>GigShield</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Official Settlement Receipt</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#111827' }}>CLAIM #{claim.id}</div>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{new Date(claim.createdAt || Date.now()).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '0.9rem', textTransform: 'uppercase' }}>Issued To:</h4>
          <div style={{ fontWeight: 600, color: '#111827' }}>{worker?.fullName || 'Gig Worker'}</div>
          <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>{worker?.email || 'N/A'}</div>
          <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>City: {worker?.city || 'N/A'}</div>
        </div>
        
        <table style={{ width: '100%', marginBottom: '32px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280', fontSize: '0.85rem' }}>
              <th style={{ padding: '8px 0' }}>Description</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px 0', color: '#111827', fontWeight: 500 }}>
                Parametric Payout ({claim.eventType || 'Weather'})
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', fontWeight: 400 }}>
                  Risk Score: {(claim.riskScore * 100).toFixed(0)}%
                </div>
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right', color: '#111827', fontWeight: 600 }}>₹{claim.claimAmount}</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', paddingTop: '16px', marginBottom: '32px', fontWeight: 700, fontSize: '1.2rem', color: claim.status === 'APPROVED' ? '#10b981' : '#111827' }}>
          <span>Status: {claim.status}</span>
          <span>₹{claim.claimAmount}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1, background: '#111827', color: '#fff', border: 'none' }}>Print / Save as PDF</button>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderColor: '#d1d5db', color: '#374151' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Claims() {
  const { worker } = useAuth();
  const { showSuccess, showError } = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [settlementClaim, setSettlementClaim] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  useEffect(() => { fetchClaims(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClaims = async () => {
    try {
      const response = await claimApi.getWorkerClaims(worker.id);
      const data = response?.data;
      setClaims(Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClaims();
  };

  const handleDownloadInvoice = (claimId) => {
    const c = claims.find(x => x.id === claimId);
    if (c) setSettlementClaim(c);
  };

  // Filter by date range
  const filteredClaims = (() => {
    const safeClaims = Array.isArray(claims) ? claims : [];
    const range = DATE_RANGES.find(r => r.key === dateRange);
    if (!range || !range.days) return safeClaims;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    return safeClaims.filter(c => {
      const date = new Date(c.triggeredAt || c.createdAt);
      return !isNaN(date.getTime()) && date >= cutoff;
    });
  })();

  // Export claims as CSV
  const handleExportCSV = useCallback(() => {
    if (!filteredClaims.length) return;
    const headers = ['Claim #', 'Plan', 'Event', 'Risk Score', 'Est. Loss', 'Claim Amount', 'Fraud Check', 'Status', 'Payout', 'Triggered At'];
    const rows = filteredClaims.map(c => [
      `#${c.id}`,
      c.planName || '',
      c.eventType || '',
      Number(c.riskScore).toFixed(2),
      c.estimatedLoss || 0,
      c.claimAmount || 0,
      c.fraudCheckPassed ? 'Passed' : 'Failed',
      c.status || '',
      c.payoutAmount || '',
      c.triggeredAt ? new Date(c.triggeredAt).toLocaleString('en-IN') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gigshield_claims_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Exported', `${filteredClaims.length} claims exported as CSV.`);
  }, [filteredClaims, showSuccess]);

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dt; }
  };

  if (loading) return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
            <FileText size={20} />
          </div>
          My Claims
        </h1>
        <p>Track all your insurance claims and payouts</p>
      </div>
      <TableSkeleton rows={6} cols={8} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>
            <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
              <FileText size={20} />
            </div>
            My Claims
          </h1>
          <p>Track all your insurance claims and payouts</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Date Range Filter */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              aria-expanded={showDateDropdown}
              aria-label="Filter by date range"
            >
              <Calendar size={14} />
              {DATE_RANGES.find(r => r.key === dateRange)?.label}
              <ChevronDown size={14} />
            </button>
            {showDateDropdown && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', overflow: 'hidden', minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}>
                {DATE_RANGES.map(range => (
                  <button
                    key={range.key}
                    onClick={() => { setDateRange(range.key); setShowDateDropdown(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', border: 'none', cursor: 'pointer',
                      background: dateRange === range.key ? 'var(--accent-teal-glow)' : 'transparent',
                      color: dateRange === range.key ? 'var(--accent-teal)' : 'var(--text-secondary)',
                      fontSize: '0.85rem', fontWeight: dateRange === range.key ? 600 : 400,
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh claims list"
            aria-label="Refresh claims list"
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {filteredClaims.length > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExportCSV}
              title="Export claims as CSV file"
              aria-label="Export all claims as CSV"
            >
              <FileDown size={14} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* aria-live region for dynamic updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {refreshing ? 'Refreshing claims list…' : ''}
      </div>

      {error && <div className="alert alert-error" role="alert"><AlertCircle size={16} /> {error}</div>}

      {filteredClaims.length > 0 ? (
        <div className="table-container">
          <table className="data-table" aria-label="Claims history table">
            <thead>
              <tr>
                <th scope="col">Claim #</th>
                <th scope="col">Plan</th>
                <th scope="col">Event</th>
                <th scope="col">Risk Score</th>
                <th scope="col">Est. Loss</th>
                <th scope="col">Claim Amt</th>
                <th scope="col">Fraud Check</th>
                <th scope="col">Status</th>
                <th scope="col">Payout</th>
                <th scope="col">Triggered</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => {
                const riskVal = Number(claim.riskScore);
                const riskClass = riskVal >= 0.7 ? 'risk-high' : riskVal >= 0.4 ? 'risk-medium' : 'risk-low';
                return (
                  <>
                    <tr key={claim.id} className="table-row-hover"
                      onClick={() => setExpandedTimeline(expandedTimeline === claim.id ? null : claim.id)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view status timeline"
                    >
                      <td style={{ fontWeight: 700 }}>#{claim.id}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{claim.planName}</td>
                      <td><span className="badge badge-info">{claim.eventType}</span></td>
                      <td>
                        <span className={`risk-score ${riskClass}`}>
                          {riskVal.toFixed(2)}
                          <span className="risk-bar" aria-hidden="true">
                            <span className="risk-bar-fill" style={{ width: `${riskVal * 100}%` }} />
                          </span>
                        </span>
                      </td>
                      <td>{formatCurrency(claim.estimatedLoss)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{formatCurrency(claim.claimAmount)}</td>
                      <td>
                        {claim.fraudCheckPassed
                          ? <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={14} aria-hidden="true" /> Passed</span>
                          : <span style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={14} aria-hidden="true" /> Failed</span>
                        }
                      </td>
                      <td><span className={`badge badge-${claim.status?.toLowerCase()}`}>{claim.status}</span></td>
                      <td>
                        {claim.payoutAmount ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Banknote size={14} aria-hidden="true" /> {formatCurrency(claim.payoutAmount)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{claim.payoutStatus}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{formatDateTime(claim.triggeredAt)}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(claim.id); }}
                          disabled={downloading === claim.id}
                          title="Download Settlement Notice PDF"
                          aria-label={`Download settlement notice for claim #${claim.id}`}
                          style={{ padding: '4px 8px' }}
                        >
                          {downloading === claim.id
                            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                            : <Download size={14} aria-hidden="true" />}
                        </button>
                      </td>
                    </tr>
                    {/* Timeline expansion */}
                    {expandedTimeline === claim.id && (
                      <tr key={`timeline-${claim.id}`} className="timeline-row">
                        <td colSpan="11" style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)' }}>
                          <ClaimTimeline claim={claim} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card empty-state">
          <svg width="100" height="80" viewBox="0 0 100 80" fill="none" aria-hidden="true" style={{ marginBottom: 16 }}>
            <rect x="20" y="10" width="60" height="60" rx="8" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" />
            <rect x="32" y="28" width="36" height="3" rx="1.5" fill="rgba(245,158,11,0.3)" />
            <rect x="32" y="36" width="28" height="3" rx="1.5" fill="rgba(245,158,11,0.2)" />
            <rect x="32" y="44" width="20" height="3" rx="1.5" fill="rgba(245,158,11,0.15)" />
            <circle cx="50" cy="18" r="6" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" />
          </svg>
          <h3>No claims yet</h3>
          <p>Claims are automatically triggered when environmental events affect your area</p>
        </div>
      )}
    </div>
  );
}

export default memo(Claims);
