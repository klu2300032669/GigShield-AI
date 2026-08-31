import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add AiAnalysisModal component
modal_code = '''
// ---- AI Claims Underwriting Console ----
function AiAnalysisModal({ claim, onClose }) {
  if (!claim) return null;
  
  // Deterministic mock data based on claim ID and Risk Score
  const rScore = Number(claim.riskScore) || 0.7;
  const isHighRisk = rScore >= 0.7;
  
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', border: '1px solid ' + (isHighRisk ? 'var(--accent-emerald)' : 'var(--accent-rose)'), maxWidth: '600px', width: '100%', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={20} style={{ color: 'var(--accent-teal)' }} /> AI Underwriting Console
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Claim ID</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>#{claim.id}</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk Probability (Auto-Approve)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: isHighRisk ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{(rScore * 100).toFixed(1)}%</div>
          </div>
        </div>

        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>SHAP Value Breakdown (Feature Importance)</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>Precipitation Threshold (150mm)</span>
              <span style={{ color: 'var(--accent-emerald)' }}>+0.42</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <div style={{ width: '85%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '4px' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>Geofence Proximity (Target City)</span>
              <span style={{ color: 'var(--accent-emerald)' }}>+0.21</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <div style={{ width: '65%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '4px' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>Historical Claim Frequency</span>
              <span style={{ color: 'var(--accent-rose)' }}>-0.08</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <div style={{ width: '15%', height: '100%', background: 'var(--accent-rose)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
        
        <div style={{ padding: '16px', background: isHighRisk ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', border: '1px solid ' + (isHighRisk ? 'var(--accent-emerald)' : 'var(--accent-rose)') }}>
          <div style={{ fontWeight: 600, color: isHighRisk ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginBottom: '4px' }}>
            {isHighRisk ? 'AI Recommendation: AUTO-APPROVE' : 'AI Recommendation: MANUAL REVIEW REQUIRED'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isHighRisk ? 'All oracle telemetry parameters exceed smart contract thresholds. No fraudulent anomalies detected.' : 'Risk score falls below the 70% threshold. Human adjuster review is recommended.'}
          </div>
        </div>

      </div>
    </div>
  );
}
'''
content = content.replace("function AdminDashboard() {", modal_code + "\nfunction AdminDashboard() {")

# 2. Add state
state_injection = "  const [claims, setClaims] = useState([]);\n  const [selectedAiClaim, setSelectedAiClaim] = useState(null);"
content = content.replace("  const [claims, setClaims] = useState([]);", state_injection)

# 3. Add AI Analysis Button to the actions table
button_injection = '''
                              <button
                                className="admin-action-btn"
                                onClick={() => setSelectedAiClaim(claim)}
                                aria-label={AI Analysis for #}
                                style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-sky)' }}
                                title="AI Underwriting Breakdown"
                              >
                                <Brain size={12} aria-hidden="true" /> AI
                              </button>
'''
# inject before the approve button
content = content.replace('''<button
                                className="admin-action-btn approve"''', button_injection + '''<button
                                className="admin-action-btn approve"''')

# 4. Render modal at the bottom
render_modal = '''
      {selectedAiClaim && (
        <AiAnalysisModal claim={selectedAiClaim} onClose={() => setSelectedAiClaim(null)} />
      )}
    </div>
  );
'''
content = content.replace("    </div>\n  );\n}", render_modal + "\n}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
