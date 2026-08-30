import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Dashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

passport_component = '''
// ---- Digital Insurance Passport (Apple Wallet Style) ----
function DigitalPassport({ worker, dashboard, aiRiskData }) {
  if (!worker) return null;
  const isProtected = dashboard?.activePolicies > 0;
  
  return (
    <div className="passport-container animate-fade-in-up" style={{
      position: 'relative', width: '100%',
      margin: '0 0 var(--space-2xl) 0', borderRadius: '24px',
      background: isProtected ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
      padding: '24px', color: '#fff', 
      boxShadow: isProtected ? '0 20px 40px rgba(16,185,129,0.3)' : '0 10px 30px rgba(0,0,0,0.1)',
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Background Pattern */}
      <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.1, transform: 'rotate(15deg)' }}>
        <Shield size={180} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9 }}>GigShield Smart ID</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>{worker.fullName}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {city || worker.city}
          </div>
        </div>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', 
          padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          {isProtected ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{isProtected ? 'COVERED' : 'UNINSURED'}</span>
        </div>
      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px' }}>Real-Time AI Risk Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{aiRiskData?.risk_score ? (aiRiskData.risk_score * 100).toFixed(0) : '0'}</span>
            <span style={{ fontSize: '1rem', opacity: 0.8 }}>/ 100</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
           <div style={{ background: '#fff', padding: '8px', borderRadius: '12px', display: 'inline-block' }}>
             {/* Abstract QR Code pattern */}
             <svg width="40" height="40" viewBox="0 0 48 48" fill="#0f172a">
               <path d="M0,0 h14 v14 h-14 z M4,4 h6 v6 h-6 z M34,0 h14 v14 h-14 z M38,4 h6 v6 h-6 z M0,34 h14 v14 h-14 z M4,38 h6 v6 h-6 z M18,0 h12 v4 h-12 z M18,6 h4 v8 h-4 z M24,6 h6 v4 h-6 z M26,12 h4 v6 h-4 z M18,16 h6 v2 h-6 z M34,18 h14 v6 h-14 z M38,20 h6 v2 h-6 z M0,18 h14 v12 h-14 z M4,22 h6 v4 h-6 z M18,22 h8 v4 h-8 z M28,20 h4 v6 h-4 z M18,28 h4 v4 h-4 z M24,28 h8 v6 h-8 z M34,28 h6 v4 h-6 z M42,28 h6 v6 h-6 z M34,34 h4 v4 h-4 z M40,36 h8 v4 h-8 z M34,40 h14 v8 h-14 z M38,44 h6 v2 h-6 z M18,36 h4 v12 h-4 z M24,36 h8 v4 h-8 z M24,42 h6 v6 h-6 z"/>
             </svg>
           </div>
        </div>
      </div>
    </div>
  );
}
'''

# Inject component definition before Dashboard function
if 'function DigitalPassport' not in content:
    content = content.replace("function Dashboard() {", passport_component + "\nfunction Dashboard() {")

# Render it right after the header
inject_render = '''
      {/* GigShield Digital Passport (Apple Wallet Style) */}
      <DigitalPassport worker={worker} dashboard={dashboard} aiRiskData={aiRiskData} />
'''

if '<DigitalPassport' not in content:
    content = content.replace('''<div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>''', inject_render + "\n        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>")


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
