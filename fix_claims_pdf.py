import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Claims.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add SettlementModal component
settlement_modal = '''
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
'''
content = content.replace("function Claims() {", settlement_modal + "\nfunction Claims() {")

# 2. Modify handleDownloadInvoice in Claims()
content = content.replace("const [downloading, setDownloading] = useState(null);", "const [downloading, setDownloading] = useState(null);\n  const [settlementClaim, setSettlementClaim] = useState(null);")
content = re.sub(r'const handleDownloadInvoice = useCallback.*?\}, \[showSuccess, showError\]\);', 'const handleDownloadInvoice = (claimId) => {\n    const c = claims.find(x => x.id === claimId);\n    if (c) setSettlementClaim(c);\n  };', content, flags=re.DOTALL)

# 3. Render SettlementModal
# Find the return statement of Claims component
content = content.replace("      {error && (", "      {settlementClaim && (\n        <SettlementModal claim={settlementClaim} worker={worker} onClose={() => setSettlementClaim(null)} />\n      )}\n      {error && (")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
