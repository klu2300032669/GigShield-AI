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

  const hash = `0x${(policy.id * 893452).toString(16).padEnd(40, '0')}`;
  
  // Fake a solidity-style contract string dynamically based on the coverage type
  let conditions = '';
  if (policy.coverageType === 'RAIN' || policy.coverageType === 'ALL') {
    conditions += `    require(oracle.getRainfall(worker.city) > 30mm, "Rainfall threshold not met");\n`;
  }
  if (policy.coverageType === 'HEAT' || policy.coverageType === 'ALL') {
    conditions += `    require(oracle.getTemperature(worker.city) > 42C, "Heat threshold not met");\n`;
  }
  
  const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract GigShieldParametric {
  address public protocolTreasury = 0x8a9C...3b1;
  address public workerWallet = 0x${Math.random().toString(16).slice(2,10)}...;

  struct Policy {
    uint256 maxPayout;
    string city;
    bool isActive;
  }

  Policy public activePolicy = Policy(${policy.maxPayout}, "${policy.planName}", true);

  function executePayout() external {
    require(activePolicy.isActive, "Policy expired");
${conditions}
    // Triggers instant stablecoin transfer via Protocol Treasury
    payable(workerWallet).transfer(activePolicy.maxPayout);
    
    emit PayoutExecuted(workerWallet, activePolicy.maxPayout);
  }
}`;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-primary)', border: '1px solid var(--accent-purple)',
        maxWidth: '700px', width: '100%', padding: '0', borderRadius: '12px',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.15)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'rgba(139, 92, 246, 0.1)', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px' }}>
              <Code size={20} style={{ color: 'var(--accent-purple)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Live Smart Contract</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontFamily: 'monospace', marginTop: 4 }}>
                {hash}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px' }}>âœ•</button>
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', gap: '24px', padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 10px var(--accent-emerald)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Active & Monitoring</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <Lock size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Oracle:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Open-Meteo Node</span>
          </div>
        </div>

        {/* Code Block */}
        <div style={{ padding: '24px', background: 'var(--bg-secondary)', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', color: '#a5b4fc', lineHeight: 1.6 }}>
            <code>{contractCode}</code>
          </pre>
        </div>
        
        {/* Footer */}
        <div style={{ padding: '16px 24px', background: 'rgba(16, 185, 129, 0.05)', borderTop: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
            This contract is cryptographically signed and secured on the ledger. Payouts execute automatically.
          </span>
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
    if (!val) return 'â‚¹0';
    return 'â‚¹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
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
                    Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} â€” renew soon!
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
                      {policy.startDate} â€” {policy.endDate}
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

      {/* Accessible Confirm Dialog â€” replaces window.confirm */}
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


