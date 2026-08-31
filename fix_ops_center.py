import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Terminal State
if 'const [terminalLogs, setTerminalLogs] = useState([]);' not in content:
    content = content.replace('const [actionLoading, setActionLoading] = useState(null);', 'const [actionLoading, setActionLoading] = useState(null);\n  const [terminalLogs, setTerminalLogs] = useState([]);')

# Add ops-center tab
if '{ key: \'ops-center\', label: \'Disaster Ops Center\' }' not in content:
    content = content.replace('{ key: \'claims\', label: Claims () },', '{ key: \'claims\', label: Claims () },\n          { key: \'ops-center\', label: \'Disaster Ops Center\' },')

# Add Ops Center Tab Panel
ops_center_ui = '''
      {/* Disaster Ops Center */}
      {activeTab === 'ops-center' && (
        <div className="admin-section" role="tabpanel" aria-label="Disaster Operations Center">
          <div className="section-header">
            <div className="section-title"><Activity size={18} style={{ color: 'var(--accent-rose)' }} aria-hidden="true" /> Live Parametric Operations</div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
            
            {/* Left: Webhook / Event Emitter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CloudSun size={18} /> Trigger Oracle Webhook
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Inject a simulated Severe Weather payload directly into the GigShield API to test mass smart-contract auto-payouts.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ background: 'var(--danger)', borderColor: 'var(--danger)', flex: 1 }}
                    onClick={async () => {
                      try {
                        const targetCity = window.prompt("TARGET CITY FOR MASSIVE FLOOD (e.g. Mumbai, Delhi):", "Mumbai");
                        if (!targetCity) return;
                        
                        setTerminalLogs(prev => [[] INITIATING MASSIVE FLOOD IN ..., ...prev]);
                        
                        setActionLoading('sim-rain');
                        await adminApi.simulateEvent({ city: targetCity.trim(), type: 'HEAVY_RAIN' });
                        
                        setTerminalLogs(prev => [
                          [] SUCCESS: Oracle Webhook Received.,
                          [] WARNING: Precipitation exceeds 150mm threshold in .,
                          [] TRIG: Parametric engine is now scanning active policies...,
                          ...prev
                        ]);
                        
                        setTimeout(() => fetchAll(), 3000);
                      } catch (err) {
                        setTerminalLogs(prev => [[] ERROR: , ...prev]);
                      } finally { setActionLoading(null); }
                    }}
                    disabled={actionLoading === 'sim-rain'}
                  >
                    {actionLoading === 'sim-rain' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CloudSun size={16} />} 
                    Inject Flood Event
                  </button>
                  
                  <button 
                    className="btn btn-primary" 
                    style={{ background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', color: '#000', flex: 1 }}
                    onClick={async () => {
                      try {
                        const targetCity = window.prompt("TARGET CITY FOR EXTREME HEATWAVE (e.g. Delhi, Chennai):", "Delhi");
                        if (!targetCity) return;
                        
                        setTerminalLogs(prev => [[] INITIATING EXTREME HEATWAVE IN ..., ...prev]);
                        
                        setActionLoading('sim-heat');
                        await adminApi.simulateEvent({ city: targetCity.trim(), type: 'EXTREME_HEAT' });
                        
                        setTerminalLogs(prev => [
                          [] SUCCESS: Oracle Webhook Received.,
                          [] CRITICAL: Temperature > 45°C sustained in .,
                          [] TRIG: Activating heatwave smart-contracts...,
                          ...prev
                        ]);
                        
                        setTimeout(() => fetchAll(), 3000);
                      } catch (err) {
                        setTerminalLogs(prev => [[] ERROR: , ...prev]);
                      } finally { setActionLoading(null); }
                    }}
                    disabled={actionLoading === 'sim-heat'}
                  >
                    {actionLoading === 'sim-heat' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Flame size={16} />} 
                    Inject Heatwave
                  </button>
                </div>
              </div>
              
              <div className="glass-card" style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} /> Active Oracle Connections
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Open-Meteo V1 API</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latency: 45ms • 99.9% Uptime</div>
                    </div>
                    <span className="badge badge-success">Live Syncing</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>GigShield AI Risk Cluster</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TensorFlow / XGBoost</div>
                    </div>
                    <span className="badge badge-success">Live Syncing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Smart Contract Terminal */}
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                  SMART CONTRACT LEDGER
                </div>
                <button 
                  onClick={() => setTerminalLogs([])}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
              <div style={{ padding: '16px', flex: 1, background: '#0a0a0a', fontFamily: 'monospace', fontSize: '0.75rem', color: '#10b981', overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {terminalLogs.length === 0 ? (
                  <div style={{ color: '#404040', fontStyle: 'italic' }}>Listening for Oracle triggers...</div>
                ) : (
                  terminalLogs.map((log, i) => (
                    <div key={i} style={{ color: log.includes('ERROR') ? '#ef4444' : log.includes('WARNING') || log.includes('CRITICAL') ? '#f59e0b' : '#10b981' }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
'''

if 'Disaster Ops Center' not in content:
    # We will inject the new tab panel before {/* Claims Table */}
    content = content.replace('{/* Claims Table */}', ops_center_ui + '\n      {/* Claims Table */}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
