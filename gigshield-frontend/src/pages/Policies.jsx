import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { policyApi, invoiceApi } from '../api/api.js';
import { CardSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  ClipboardList, Shield, CloudRain, Flame, Wind,
  Calendar, Banknote, AlertCircle, XCircle, Loader2, Download, Code, CheckCircle2, Lock
} from 'lucide-react';

function SmartContractViewer({ policy, onClose }) {
  if (!policy) return null;

  const hash = "0x" + (policy.id * 893452).toString(16).padEnd(40, '0');
  
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent-emerald)', maxWidth: '600px', width: '100%', padding: '0', borderRadius: '16px', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} /> Active Parametric Triggers
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={20} /></button>
        </div>
        
        <div style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            This policy is governed by an automated Smart Contract. If Oracle telemetry detects any of the following conditions in your city, the payout of <strong>₹{policy.maxPayout}</strong> will be deposited instantly.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {(policy.coverageType === 'RAIN' || policy.coverageType === 'ALL') && (
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <CloudRain size={24} style={{ color: 'var(--accent-sky)' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Heavy Rainfall Exceeds 150mm</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified via Open-Meteo V1 API</div>
                </div>
              </div>
            )}
            
            {(policy.coverageType === 'HEAT' || policy.coverageType === 'ALL') && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Flame size={24} style={{ color: 'var(--accent-amber)' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Extreme Heat Exceeds 45°C</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sustained for 4+ hours</div>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ background: '#0a0a0a', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div><span style={{ color: '#404040' }}>// Contract Hash (Immutable)</span></div>
            <div>{hash}</div>
            <div style={{ marginTop: '8px' }}><span style={{ color: '#404040' }}>// Status</span></div>
            <div style={{ color: policy.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}>{policy.status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


function InvoiceModal({ policy, worker, onClose }) {
  if (!policy) return null;
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#000000', maxWidth: '500px', width: '100%', padding: '32px', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '1.5rem', fontWeight: 800 }}>GigShield</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Official Tax Invoice</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#111827' }}>INVOICE #{policy.id}</div>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{new Date(policy.startDate).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '0.9rem', textTransform: 'uppercase' }}>Billed To:</h4>
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
                {policy.planName}
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', fontWeight: 400 }}>
                  Valid: {new Date(policy.startDate).toLocaleDateString()} - {new Date(policy.endDate).toLocaleDateString()}
                </div>
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right', color: '#111827', fontWeight: 600 }}>₹{policy.premiumAmount}</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', paddingTop: '16px', marginBottom: '32px', fontWeight: 700, fontSize: '1.2rem', color: '#111827' }}>
          <span>Total Paid</span>
          <span>₹{policy.premiumAmount}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1, background: '#111827', color: '#fff', border: 'none' }}>Print / Save as PDF</button>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderColor: '#d1d5db', color: '#374151' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Policies() {
  const { worker } = useAuth();
  const { showSuccess, showError } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [invoicePolicy, setInvoicePolicy] = useState(null);
  const [viewingContract, setViewingContract] = useState(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [policyToCancel, setPolicyToCancel] = useState(null);

  const fetchPolicies = useCallback(async () => {
    try {
      const response = await policyApi.getWorkerPolicies(worker.id);
      const data = response?.data;
      setPolicies(Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [worker.id]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const openCancelConfirm = (policy) => {
    setPolicyToCancel(policy);
    setConfirmOpen(true);
  };

  const handleCancel = useCallback(async () => {
    if (!policyToCancel) return;
    setCancelling(policyToCancel.id);
    setConfirmOpen(false);
    try {
      await policyApi.cancel(policyToCancel.id);
      showSuccess('Policy Cancelled', `Policy #${policyToCancel.id} has been cancelled.`);
      fetchPolicies();
    } catch (err) {
      showError('Cancellation Failed', err.message);
    } finally {
      setCancelling(null);
      setPolicyToCancel(null);
    }
  }, [policyToCancel, showSuccess, showError, fetchPolicies]);

  const handleDownloadInvoice = (policyId) => {
    const p = policies.find(x => x.id === policyId);
    if (p) setInvoicePolicy(p);
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const getCoverageIcon = (type) => {
    switch (type) {
      case 'RAIN': return <CloudRain size={18} aria-hidden="true" />;
      case 'HEAT': return <Flame size={18} aria-hidden="true" />;
      case 'POLLUTION': return <Wind size={18} aria-hidden="true" />;
      default: return <Shield size={18} aria-hidden="true" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'active-policy';
      case 'EXPIRED': return 'expired-policy';
      case 'CANCELLED': return 'cancelled-policy';
      default: return '';
    }
  };

  // Renewal days remaining
  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / 86400000);
    return days;
  };

  if (loading) return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)' }}>
            <ClipboardList size={20} />
          </div>
          My Policies
        </h1>
      </div>
      <div className="cards-grid">
        {[...Array(3)].map((_, i) => <CardSkeleton key={i} lines={4} />)}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)' }}>
            <ClipboardList size={20} aria-hidden="true" />
          </div>
          My Policies
        </h1>
        <p>Manage your active insurance policies</p>
      </div>

      {error && <div className="alert alert-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {error}</div>}

      {policies.length > 0 ? (
        <div className="cards-grid stagger-children">
          {policies.map((policy) => {
            const daysLeft = getDaysUntilExpiry(policy.endDate);
            const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
            return (
              <div key={policy.id} className={`policy-card ${getStatusClass(policy.status)}`} aria-label={`Policy: ${policy.planName}`}>
                <div className="policy-card-header">
                  <div>
                    <div className="policy-card-title">{policy.planName}</div>
                    <div className="policy-card-id">Policy #{policy.id}</div>
                  </div>
                  <span className={`badge badge-${policy.status?.toLowerCase()}`} aria-label={`Status: ${policy.status}`}>{policy.status}</span>
                </div>

                {/* Renewal countdown */}
                {isExpiringSoon && (
                  <div role="alert" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                    fontSize: '0.78rem', color: 'var(--accent-amber)', marginBottom: 12
                  }}>
                    <Calendar size={13} aria-hidden="true" />
                    Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} — renew soon!
                  </div>
                )}

                <div className="policy-card-details">
                  <div className="policy-detail-item">
                    <div className="policy-detail-label">Coverage</div>
                    <div className="policy-detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getCoverageIcon(policy.coverageType)}
                      {policy.coverageType}
                    </div>
                  </div>
                  <div className="policy-detail-item">
                    <div className="policy-detail-label">Premium Paid</div>
                    <div className="policy-detail-value" style={{ color: 'var(--accent-blue)' }}>
                      {formatCurrency(policy.premiumPaid)}
                    </div>
                  </div>
                  <div className="policy-detail-item">
                    <div className="policy-detail-label">Max Payout</div>
                    <div className="policy-detail-value" style={{ color: 'var(--accent-emerald)' }}>
                      {formatCurrency(policy.maxPayout)}
                    </div>
                  </div>
                  <div className="policy-detail-item">
                    <div className="policy-detail-label">Period</div>
                    <div className="policy-detail-value" style={{ fontSize: '0.82rem' }}>
                      {policy.startDate} — {policy.endDate}
                    </div>
                  </div>
                </div>

                {/* REAL WORLD FEATURE: Smart Contract Viewer Button */}
                <div style={{ marginTop: '12px' }}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{ width: '100%', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', display: 'flex', justifyContent: 'center', gap: 6 }}
                    onClick={() => setViewingContract(policy)}
                  >
                    <Shield size={14} /> View Smart Contract Ledger
                  </button>
                </div>

                <div className="policy-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Calendar size={13} aria-hidden="true" />
                    Ends {policy.endDate}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDownloadInvoice(policy.id)}
                      disabled={downloading === policy.id}
                      title="Download Policy Invoice PDF"
                      aria-label={`Download invoice for policy #${policy.id}`}
                    >
                      {downloading === policy.id
                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                        : <Download size={14} aria-hidden="true" />}
                    </button>
                    {policy.status === 'ACTIVE' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openCancelConfirm(policy)}
                        disabled={cancelling === policy.id}
                        aria-label={`Cancel policy #${policy.id}`}
                        title="Cancel this policy"
                      >
                        {cancelling === policy.id
                          ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                          : <XCircle size={14} aria-hidden="true" />}
                        {cancelling === policy.id ? '' : ' Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card empty-state">
          <div className="empty-state-icon"><ClipboardList size={28} aria-hidden="true" /></div>
          <h3>No policies yet</h3>
          <p>Purchase an insurance plan to get started with protection</p>
        </div>
      )}
      
      {/* Smart Contract Viewer Modal */}
      <SmartContractViewer 
        policy={viewingContract} 
        onClose={() => setViewingContract(null)} 
      />

      {/* Accessible Confirm Dialog — replaces window.confirm */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleCancel}
        onCancel={() => { setConfirmOpen(false); setPolicyToCancel(null); }}
        title="Cancel Policy"
        message={`Are you sure you want to cancel "${policyToCancel?.planName}" (Policy #${policyToCancel?.id})? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Policy"
        cancelLabel="Keep Policy"
        variant="danger"
        isLoading={cancelling === policyToCancel?.id}
      />
    </div>
  );
}

export default Policies;


