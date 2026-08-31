import { useState, useEffect } from 'react';
import { adminApi, aiApi } from '../api/api.js';
import { TableSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  ShieldCheck, Users, ClipboardList, FileText, Banknote,
  AlertCircle, CheckCircle2, XCircle, TrendingUp, Activity,
  CloudSun, Loader2, Trash2, BrainCircuit, Send, Bell, Mic,
  User, MapPin, Briefcase
} from 'lucide-react';

function AdminDashboard() {
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Confirm dialog state
  const [confirm, setConfirm] = useState({ open: false, type: null, id: null, label: '' });

  // Notification modal state
  const [notifyModal, setNotifyModal] = useState({ open: false, workerId: null, fullName: '', title: '', message: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, workersRes, claimsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getWorkers(),
        adminApi.getClaims(),
      ]);
      setStats(statsRes.data);
      setWorkers(workersRes.data?.content || []);
      setClaims(claimsRes.data?.content || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const openConfirm = (type, id, label) => setConfirm({ open: true, type, id, label });
  const closeConfirm = () => setConfirm({ open: false, type: null, id: null, label: '' });

  const handleConfirmedAction = async () => {
    const { type, id } = confirm;
    closeConfirm();
    setActionLoading(`${type}-${id}`);
    try {
      if (type === 'approve') {
        await adminApi.approveClaim(id);
        showSuccess('Claim Approved', `Claim #${id} has been approved.`);
      } else if (type === 'reject') {
        await adminApi.rejectClaim(id);
        showSuccess('Claim Rejected', `Claim #${id} has been rejected.`);
      } else if (type === 'toggle') {
        await adminApi.toggleWorkerStatus(id);
        showSuccess('Worker Updated', `Worker status has been toggled.`);
      } else if (type === 'promote') {
        await adminApi.promoteWorker(id);
        showSuccess('Worker Updated', `Worker role has been changed.`);
      } else if (type === 'delete-worker') {
        await adminApi.deleteWorker(id);
        showSuccess('Worker Deleted', `Worker #${id} has been permanently deleted.`);
      } else if (type === 'delete-claim') {
        await adminApi.deleteClaim(id);
        showSuccess('Claim Deleted', `Claim #${id} has been permanently deleted.`);
      }
      fetchAll();
    } catch (err) {
      showError('Action Failed', err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };



  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyModal.title || !notifyModal.message) {
      showError('Validation Error', 'Title and message are required.');
      return;
    }
    try {
      setActionLoading('notify');
      await adminApi.sendNotification({
        workerId: notifyModal.workerId,
        title: notifyModal.title,
        message: notifyModal.message
      });
      showSuccess('Notification Sent', `Successfully pushed notification to ${notifyModal.fullName}.`);
      setNotifyModal({ open: false, workerId: null, fullName: '', title: '', message: '' });
    } catch (err) {
      showError('Failed to Send', err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  if (loading) return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
            <ShieldCheck size={20} />
          </div>
          Admin Dashboard
        </h1>
      </div>
      <div className="metrics-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card teal" style={{ opacity: 0.5 }} aria-hidden="true">
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ width: 60, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginTop: 12 }} />
          </div>
        ))}
      </div>
      <TableSkeleton rows={5} cols={8} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>
            <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            Admin Dashboard
            <span className="admin-badge-title" aria-label="Admin user">★ Admin</span>
          </h1>
          <p>Platform-wide management and insights</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

          <button 
            className="btn btn-outline" 
            style={{ color: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)' }}
            onClick={() => {
              if (!claims || claims.length === 0) return showError("No data", "There are no claims to export.");
              
              // Build CSV
              const headers = ["ID", "Plan", "Event", "Risk Score", "Amount", "Status", "Date"];
              const csvRows = [headers.join(",")];
              
              claims.forEach(c => {
                csvRows.push([
                  c.id, 
                  "", 
                  c.eventType, 
                  c.riskScore, 
                  c.claimAmount, 
                  c.status, 
                  c.createdAt || new Date().toISOString()
                ].join(","));
              });
              
              const csvString = csvRows.join("\n");
              const blob = new Blob([csvString], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = gigshield_global_ledger.csv;
              a.click();
              showSuccess("Exported", "Global ledger downloaded successfully.");
            }}
          >
            <FileText size={16} /> Export Ledger (CSV)
          </button>

          
          
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}
            onClick={async () => {
              try {
                const targetCity = window.prompt("🚨 AI DISASTER SIMULATION 🚨\\n\\nEnter the city to simulate a massive flood event in (e.g., Mumbai, Delhi, Bangalore):", "Mumbai");
                if (!targetCity) return; // User cancelled
                
                if (!window.confirm(`DANGER: This will generate a simulated 150mm flood in ${targetCity} and force the backend Cron Job to trigger Python AI Auto-Adjudication. Proceed?`)) return;
                
                const { adminApi } = await import('../api/api.js');
                await adminApi.simulateEvent({ city: targetCity.trim(), type: 'HEAVY_RAIN' });
                showSuccess("Disaster Simulated!", `Triggered flood in ${targetCity}. The AI backend is now auto-adjudicating claims. Refreshing data in 3s...`);
                setTimeout(() => window.location.reload(), 3000);
              } catch (err) {
                showError("Simulation Failed", err.message);
              }
            }}
          >
            <CloudSun size={16} /> Trigger AI Disaster Simulation
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {error}</div>}

      {/* Platform Metrics */}
      {stats && (
        <div className="metrics-grid stagger-children" aria-label="Platform statistics">
          <div className="metric-card emerald">
            <div className="metric-header">
              <div className="metric-icon emerald"><Users size={20} aria-hidden="true" /></div>
            </div>
            <div className="metric-value">{stats.totalWorkers}</div>
            <div className="metric-label">Total Workers</div>
          </div>
          <div className="metric-card teal">
            <div className="metric-header">
              <div className="metric-icon teal"><ClipboardList size={20} aria-hidden="true" /></div>
            </div>
            <div className="metric-value">{stats.activePolicies}</div>
            <div className="metric-label">Active Policies</div>
          </div>
          <div className="metric-card amber">
            <div className="metric-header">
              <div className="metric-icon amber"><FileText size={20} aria-hidden="true" /></div>
            </div>
            <div className="metric-value">{stats.totalClaims}</div>
            <div className="metric-label">Total Claims</div>
          </div>
          <div className="metric-card coral">
            <div className="metric-header">
              <div className="metric-icon coral"><Activity size={20} aria-hidden="true" /></div>
            </div>
            <div className="metric-value">{stats.pendingClaims}</div>
            <div className="metric-label">Pending Claims</div>
          </div>
        </div>
      )}

      {stats && (
        <div className="metrics-grid stagger-children" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Activity size={20} style={{ color: (stats.totalPayoutAmount / (stats.totalRevenue || 1)) > 0.6 ? 'var(--accent-rose)' : 'var(--accent-sky)', marginBottom: 8 }} aria-hidden="true" />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (stats.totalPayoutAmount / (stats.totalRevenue || 1)) > 0.6 ? 'var(--accent-rose)' : 'var(--accent-sky)' }}>
              {((stats.totalPayoutAmount / (stats.totalRevenue || 1)) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Platform Loss Ratio</div>
          </div>

          <div className="glass-card" style={{ textAlign: 'center' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-emerald)', marginBottom: 8 }} aria-hidden="true" />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatCurrency(stats.totalRevenue)}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Revenue</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Banknote size={20} style={{ color: 'var(--accent-amber)', marginBottom: 8 }} aria-hidden="true" />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{formatCurrency(stats.totalPayoutAmount)}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Payouts</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--accent-teal)', marginBottom: 8 }} aria-hidden="true" />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-teal)' }}>{stats.approvedClaims}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Approved</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <CloudSun size={20} style={{ color: 'var(--accent-violet)', marginBottom: 8 }} aria-hidden="true" />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-violet)' }}>{stats.totalEvents}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Events Logged</div>
          </div>
        </div>
      )}

      {/* REAL WORLD FEATURE: Protocol Treasury & Reinsurance Exposure */}
      {stats && (
        <div className="glass-card animate-fade-in-up" style={{ marginTop: '24px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-purple)' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Protocol Treasury & Solvency Ratio</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Max Exposure (Active Policies × ₹5,000)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-coral)' }}>
                {formatCurrency(stats.activePolicies * 5000)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulated Liquidity Pool (Premiums + Reinsurance)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {formatCurrency(stats.totalRevenue + 500000)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Treasury Solvency Status</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, padding: '4px 8px', borderRadius: '12px', display: 'inline-block', background: (stats.totalRevenue + 500000) > (stats.activePolicies * 5000) ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: (stats.totalRevenue + 500000) > (stats.activePolicies * 5000) ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                {(stats.totalRevenue + 500000) > (stats.activePolicies * 5000) ? '✅ EXCELLENT (Over-collateralized)' : '⚠️ WARNING (High Exposure)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="filter-tabs" style={{ marginTop: 'var(--space-xl)' }} role="tablist" aria-label="Admin sections">
        {[
          { key: 'overview', label: `Workers (${workers.length})` },
          { key: 'claims', label: `Claims (${claims.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`filter-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workers Table */}
      {activeTab === 'overview' && (
        <div className="admin-section" role="tabpanel" aria-label="Workers management">
          <div className="section-header">
            <div className="section-title"><Users size={18} style={{ color: 'var(--accent-emerald)' }} aria-hidden="true" /> All Workers</div>
          </div>
          <div className="table-container">
            <table className="data-table" aria-label="Workers table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">City</th>
                  <th scope="col">Platform</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(w => (
                  <tr key={w.id} className="table-row-hover">
                    <td style={{ fontWeight: 700 }}>#{w.id}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{w.fullName}</td>
                    <td>{w.email}</td>
                    <td>{w.city}</td>
                    <td>{w.platformName || '—'}</td>
                    <td><span className={`badge badge-${w.role?.toLowerCase()}`}>{w.role}</span></td>
                    <td><span className={`badge ${w.isActive ? 'badge-active' : 'badge-expired'}`}>{w.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="admin-action-btn view"
                          style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-sky)' }}
                          onClick={() => setSelectedWorker(w)}
                          title="View Worker 360 Profile"
                        >
                          <User size={14} aria-hidden="true" />
                        </button>
                        <button
                          className={`admin-action-btn ${w.isActive ? 'reject' : 'approve'}`}
                          onClick={() => openConfirm('toggle', w.id, `${w.isActive ? 'Deactivate' : 'Activate'} ${w.fullName}?`)}
                          disabled={actionLoading === `toggle-${w.id}`}
                          aria-label={`${w.isActive ? 'Deactivate' : 'Activate'} worker ${w.fullName}`}
                        >
                          {actionLoading === `toggle-${w.id}` ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : (w.isActive ? 'Deactivate' : 'Activate')}
                        </button>
                        <button
                          className={`admin-action-btn ${w.role === 'ADMIN' ? 'reject' : 'complete'}`}
                          onClick={() => openConfirm('promote', w.id, `${w.role === 'ADMIN' ? 'Demote' : 'Promote'} ${w.fullName}?`)}
                          disabled={actionLoading === `promote-${w.id}`}
                          aria-label={`${w.role === 'ADMIN' ? 'Demote' : 'Make Admin'} ${w.fullName}`}
                        >
                          {actionLoading === `promote-${w.id}` ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : (w.role === 'ADMIN' ? 'Demote' : 'Make Admin')}
                        </button>
                        <button
                          className="admin-action-btn view"
                          style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)' }}
                          onClick={() => setNotifyModal({ open: true, workerId: w.id, fullName: w.fullName, title: '', message: '' })}
                          title={`Send Notification to ${w.fullName}`}
                        >
                          <Bell size={14} aria-hidden="true" />
                        </button>
                        <button
                          className="admin-action-btn reject"
                          style={{ padding: '4px 8px' }}
                          onClick={() => openConfirm('delete-worker', w.id, `Permanently delete worker ${w.fullName}? This cannot be undone.`)}
                          disabled={actionLoading === `delete-worker-${w.id}`}
                          aria-label={`Delete worker ${w.fullName}`}
                          title="Delete Worker"
                        >
                          {actionLoading === `delete-worker-${w.id}` ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claims Table */}
      {activeTab === 'claims' && (
        <div className="admin-section" role="tabpanel" aria-label="Claims management">
          <div className="section-header">
            <div className="section-title"><FileText size={18} style={{ color: 'var(--accent-amber)' }} aria-hidden="true" /> All Claims</div>
          </div>
          {claims.length > 0 ? (
            <div className="table-container">
              <table className="data-table" aria-label="Claims management table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Event</th>
                    <th scope="col">Risk</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Fraud</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map(claim => {
                    const riskVal = Number(claim.riskScore);
                    const riskClass = riskVal >= 0.7 ? 'risk-high' : riskVal >= 0.4 ? 'risk-medium' : 'risk-low';
                    return (
                      <tr key={claim.id} className="table-row-hover">
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
                        <td style={{ fontWeight: 600 }}>{formatCurrency(claim.claimAmount)}</td>
                        <td>
                          {claim.fraudCheckPassed
                            ? <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} aria-hidden="true" /> Pass</span>
                            : <span style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={14} aria-hidden="true" /> Fail</span>
                          }
                        </td>
                        <td><span className={`badge badge-${claim.status?.toLowerCase()}`}>{claim.status}</span></td>
                        <td>
                          {claim.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                className="admin-action-btn approve"
                                onClick={() => openConfirm('approve', claim.id, `Approve claim #${claim.id}?`)}
                                disabled={actionLoading === `approve-${claim.id}`}
                                aria-label={`Approve claim #${claim.id}`}
                              >
                                {actionLoading === `approve-${claim.id}` ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : <><CheckCircle2 size={12} aria-hidden="true" /> Approve</>}
                              </button>
                              <button
                                className="admin-action-btn reject"
                                onClick={() => openConfirm('reject', claim.id, `Reject claim #${claim.id}? This cannot be undone.`)}
                                disabled={actionLoading === `reject-${claim.id}`}
                                aria-label={`Reject claim #${claim.id}`}
                              >
                                {actionLoading === `reject-${claim.id}` ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : <><XCircle size={12} aria-hidden="true" /> Reject</>}
                              </button>
                              
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                          )}
                          <button
                            className="admin-action-btn reject"
                            style={{ padding: '4px 8px', marginLeft: claim.status === 'PENDING' ? 4 : 0 }}
                            onClick={() => openConfirm('delete-claim', claim.id, `Permanently delete claim #${claim.id}? This cannot be undone.`)}
                            disabled={actionLoading === `delete-claim-${claim.id}`}
                            aria-label={`Delete claim #${claim.id}`}
                            title="Delete Claim"
                          >
                            {actionLoading === `delete-claim-${claim.id}` ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card empty-state">
              <div className="empty-state-icon"><FileText size={28} aria-hidden="true" /></div>
              <h3>No claims yet</h3>
              <p>Claims will appear here when workers&apos; events trigger them</p>
            </div>
          )}
        </div>
      )}

      {/* Single Confirm Dialog handles all admin actions */}
      <ConfirmDialog
        isOpen={confirm.open}
        title="Confirm Action"
        message={confirm.label}
        onConfirm={handleConfirmedAction}
        onCancel={closeConfirm}
        confirmText={confirm.type?.includes('delete') ? 'Delete' : 'Confirm'}
        isDestructive={confirm.type?.includes('delete') || confirm.type === 'reject'}
      />

      {/* Send Notification Modal */}
      <Modal 
        isOpen={notifyModal.open} 
        onClose={() => setNotifyModal({ ...notifyModal, open: false })}
        title={`Push Notification to ${notifyModal.fullName}`}
      >
        <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="notify-title">Title</label>
            <input 
              id="notify-title" 
              className="form-input" 
              type="text" 
              placeholder="e.g. Weather Alert" 
              value={notifyModal.title}
              onChange={e => setNotifyModal({...notifyModal, title: e.target.value})}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="notify-message">Message</label>
            <textarea 
              id="notify-message" 
              className="form-input" 
              rows="4" 
              placeholder="Type your message here..."
              value={notifyModal.message}
              onChange={e => setNotifyModal({...notifyModal, message: e.target.value})}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setNotifyModal({ ...notifyModal, open: false })}>
              Cancel
            </button>
            <button type="submit" className={`btn btn-primary ${actionLoading === 'notify' ? 'btn-loading' : ''}`} disabled={actionLoading === 'notify'}>
              {!actionLoading && <><Send size={16} /> Send</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Worker 360 Profile Modal */}
      <Modal 
        isOpen={!!selectedWorker} 
        onClose={() => setSelectedWorker(null)} 
        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={20} style={{ color: 'var(--accent-emerald)' }} /> Worker 360 Profile</div>}
      >
        {selectedWorker && (
          <div style={{ padding: '10px' }}>
            {/* Header / Identity */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                {selectedWorker.fullName.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>{selectedWorker.fullName}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {selectedWorker.city}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> {selectedWorker.platformName}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Contact Email</div>
                <div style={{ fontWeight: 600 }}>{selectedWorker.email}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Status</div>
                <div>
                  <span className={selectedWorker.isActive ? "badge badge-active" : "badge badge-expired"}>
                    {selectedWorker.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>

            {/* Claim History */}
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>Claim History</h4>
            {(() => {
              const workerClaims = claims.filter(c => c.workerId === selectedWorker.id);
              if (workerClaims.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>No claims filed yet.</div>;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {workerClaims.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.planName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span className={"badge badge-" + c.status.toLowerCase()} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{c.status}</span>
                          • {c.eventType} • Risk: {Number(c.riskScore).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(c.claimAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
