import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Settings.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to wrap the return statement in if (worker?.role === 'ADMIN') return <AdminSettingsView />; else return <WorkerSettingsView />;

# Let's write a completely new Settings.jsx structure.
# Instead of manual parsing, I will just append the Admin Settings UI before the final return, and conditionally render.

admin_ui = '''
  if (worker?.role === 'ADMIN') {
    return (
      <div>
        <div className="page-header">
          <h1>
            <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
              <SettingsIcon size={20} />
            </div>
            System Configuration
            <span className="admin-badge-title">~. Admin</span>
          </h1>
          <p>Global parameters, oracle feeds, and security settings</p>
        </div>

        <div className="settings-grid">
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            
            {/* Oracle Telemetry */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon" style={{ background: 'var(--accent-sky-glow)', color: 'var(--accent-sky)' }}>
                  <Signal size={18} />
                </div>
                <h3>Oracle Data Feeds</h3>
              </div>
              <div className="settings-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="settings-field-label">Weather Oracle</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Primary meteorological data source</div>
                </div>
                <span className="badge badge-success">Open-Meteo (Active)</span>
              </div>
              <div className="settings-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="settings-field-label">AI Adjudication Engine</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>XGBoost risk prediction cluster</div>
                </div>
                <span className="badge badge-success">Online (v2.1)</span>
              </div>
              <div className="settings-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
                <div>
                  <div className="settings-field-label">Oracle Polling Frequency</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cron schedule for telemetry sync</div>
                </div>
                <select className="form-input" style={{ width: '140px', padding: '4px 8px', fontSize: '0.85rem' }} disabled>
                  <option>Every 5 Minutes</option>
                  <option>Every 15 Minutes</option>
                  <option>Every Hour</option>
                </select>
              </div>
            </div>

            {/* Parametric Engine Controls */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon" style={{ background: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)' }}>
                  <Activity size={18} />
                </div>
                <h3>Parametric Engine</h3>
              </div>
              <div className="settings-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className="settings-field-label">Auto-Payout Risk Threshold</div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>0.75</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Claims scoring above this threshold will bypass manual review and trigger smart contract payouts instantly.
                </div>
                <input type="range" min="0" max="100" defaultValue="75" className="form-input" style={{ padding: 0 }} disabled />
              </div>
              <div className="settings-field" style={{ borderBottom: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className="settings-field-label">Daily Liquidity Drain Limit</div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>,5,00,000</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Maximum protocol funds that can be automatically disbursed in a 24-hour period before requiring manual admin override.
                </div>
                <input type="range" min="0" max="1000000" defaultValue="500000" className="form-input" style={{ padding: 0 }} disabled />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            
            {/* Admin Security */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon" style={{ background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)' }}>
                  <Lock size={18} />
                </div>
                <h3>Admin Security</h3>
              </div>
              <form onSubmit={handlePasswordChange} style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Update the master administrator password. This will terminate all active admin sessions.
                </div>
                <input type="password" required className="form-input" placeholder="Current Master Password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
                <input type="password" required className="form-input" placeholder="New Secure Password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
                <input type="password" required className="form-input" placeholder="Confirm New Password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
                <button type="submit" disabled={passwordLoading} className={tn btn-primary } style={{ marginTop: '4px' }}>
                  Update Security Credentials
                </button>
              </form>
            </div>
            
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
                  <History size={18} />
                </div>
                <h3>System Audit Logs</h3>
              </div>
              <div style={{ padding: '0 16px 16px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Download immutable system logs for compliance, including all manual overrides, policy updates, and API access logs.
                </p>
                <button className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => showSuccess('Audit Log Generated', 'System logs are compiling and will download shortly.')}>
                  <Shield size={16} /> Export Audit Log (CSV)
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
'''

# Find the final return statement and inject the Admin check right before it
# The final return is eturn (\n    <div>\n      <div className="page-header">
content = content.replace('  return (\n    <div>\n      <div className="page-header">', admin_ui + '\n  return (\n    <div>\n      <div className="page-header">')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
