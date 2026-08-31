import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Policies.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Redesign SmartContractViewer
new_smart_contract = '''function SmartContractViewer({ policy, onClose }) {
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
}'''
content = re.sub(r'function SmartContractViewer\(\{ policy, onClose \}\) \{.*?(?=function Policies\(\))', new_smart_contract + "\n\n", content, flags=re.DOTALL)


# 2. Add InvoiceModal component
invoice_modal = '''
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
'''
content = content.replace("function Policies() {", invoice_modal + "\nfunction Policies() {")

# 3. Modify handleDownloadInvoice in Policies()
content = content.replace("const [downloading, setDownloading] = useState(null);", "const [downloading, setDownloading] = useState(null);\n  const [invoicePolicy, setInvoicePolicy] = useState(null);")
content = re.sub(r'const handleDownloadInvoice = useCallback.*?\}, \[showSuccess, showError\]\);', 'const handleDownloadInvoice = (policyId) => {\n    const p = policies.find(x => x.id === policyId);\n    if (p) setInvoicePolicy(p);\n  };', content, flags=re.DOTALL)

# 4. Render InvoiceModal
content = content.replace("      {viewingContract && (", "      {invoicePolicy && (\n        <InvoiceModal policy={invoicePolicy} worker={worker} onClose={() => setInvoicePolicy(null)} />\n      )}\n      {viewingContract && (")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
