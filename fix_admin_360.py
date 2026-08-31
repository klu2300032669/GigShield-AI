import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for selected worker
if 'const [selectedWorker, setSelectedWorker] = useState(null);' not in content:
    content = content.replace('const [actionLoading, setActionLoading] = useState(null);', 'const [actionLoading, setActionLoading] = useState(null);\n  const [selectedWorker, setSelectedWorker] = useState(null);')

# 2. Add "View Details" button to the worker table actions
view_btn = '''
                            <button
                              className="admin-action-btn view"
                              style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-sky)' }}
                              onClick={() => setSelectedWorker(worker)}
                              title="View Worker 360 Profile"
                            >
                              <User size={14} aria-hidden="true" />
                            </button>
'''
# Find the worker actions div and insert the button
if 'View Worker 360 Profile' not in content:
    content = content.replace('<div style={{ display: \'flex\', gap: 4 }}>', '<div style={{ display: \'flex\', gap: 4 }}>\n' + view_btn, 1)

# 3. Add the Worker 360 Modal UI just before the final </div> in the main return
modal_ui = '''
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
                  <span className={adge badge-}>
                    {selectedWorker.active ? 'Active' : 'Suspended'}
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
                          <span className={adge badge-} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{c.status}</span>
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
'''
if 'Worker 360 Profile Modal' not in content:
    # find the last </div> before the final export or just insert before final closing tag of the component
    content = content.replace('    </div>\n  );\n}\n\nexport default AdminDashboard;', modal_ui + '\n    </div>\n  );\n}\n\nexport default AdminDashboard;')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
