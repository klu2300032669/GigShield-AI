import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { policyApi, invoiceApi } from '../api/api.js';
import { CardSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  ClipboardList, Shield, CloudRain, Flame, Wind,
  Calendar, Banknote, AlertCircle, XCircle, Loader2, Download
} from 'lucide-react';

function Policies() {
  const { worker } = useAuth();
  const { showSuccess, showError } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [policyToCancel, setPolicyToCancel] = useState(null);

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    try {
      const response = await policyApi.getWorkerPolicies(worker.id);
      const data = response?.data;
      setPolicies(Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

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
  }, [policyToCancel, showSuccess, showError]);

  const handleDownloadInvoice = useCallback(async (policyId) => {
    setDownloading(policyId);
    try {
      const response = await invoiceApi.downloadPolicyInvoice(policyId);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_policy_${policyId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Downloaded', 'Policy invoice downloaded.');
    } catch (err) {
      console.error('Invoice download failed:', err);
      showError('Download Failed', 'Could not download policy invoice.');
    } finally {
      setDownloading(null);
    }
  }, [showSuccess, showError]);

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
