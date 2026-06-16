import { useState, useEffect } from 'react';
import { adminApi, aiApi } from '../api/api.js';
import { TableSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  ShieldCheck, Users, ClipboardList, FileText, Banknote,
  AlertCircle, CheckCircle2, XCircle, TrendingUp, Activity,
  CloudSun, Loader2, Trash2, BrainCircuit, Send, Bell
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

  const handleAIAnalysis = async (claim) => {
    try {
      setActionLoading(`ai-${claim.id}`);
      const payload = {
        worker_id: claim.workerId || 0,
        claim_amount: claim.claimAmount || 0,
        num_claims_30d: 0,
        avg_claim_amount: 0,
        rainfall_mm: 0,
        temperature_c: 25,
        aqi: 50,
        online_hours: 0,
        delivery_drop_rate: 0
      };
      const res = await aiApi.analyzeFraud(payload);
      const result = res.data;
      if (result.is_suspicious) {
        showError('AI Fraud Alert', `High Risk! Anomaly Score: ${result.anomaly_score.toFixed(2)}. Flags: ${result.flags.join(', ')}`);
      } else {
        showSuccess('AI Check Passed', `Low Risk. Anomaly Score: ${result.anomaly_score.toFixed(2)}.`);
      }
    } catch (err) {
      showError('AI Service Error', err.response?.data?.detail || err.message || 'Could not reach AI prediction service.');
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
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          Admin Dashboard
          <span className="admin-badge-title" aria-label="Admin user">★ Admin</span>
        </h1>
        <p>Platform-wide management and insights</p>
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
                              <button
                                className="admin-action-btn view"
                                style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-sky)' }}
                                onClick={() => handleAIAnalysis(claim)}
                                disabled={actionLoading === `ai-${claim.id}`}
                                title="Run AI Fraud Analysis"
                              >
                                {actionLoading === `ai-${claim.id}` ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : <BrainCircuit size={14} aria-hidden="true" />}
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
    </div>
  );
}

export default AdminDashboard;
