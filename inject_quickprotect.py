import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Dashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add QuickProtectWidget
widget_code = '''// ---- Quick Protect (On-Demand Shift Insurance) ----
function QuickProtectWidget({ workerId, onPurchase }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
       await new Promise(r => setTimeout(r, 1500));
       // Use plan 7 (the SHIFT plan we added to data.sql) or default to any
       const { policyApi } = await import('../api/api.js');
       await policyApi.purchase({ workerId: Number(workerId), planId: 7 });
       setSuccess(true);
       if (onPurchase) onPurchase();
    } catch (e) {
       console.log(e);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="glass-card animate-fade-in-up" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', borderColor: 'var(--accent-emerald)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
         <Shield size={32} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
         <div>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent-emerald)' }}>Shift Protection Active</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You are covered for the next 4 hours.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in-up" style={{ marginBottom: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(56, 189, 248, 0.05))', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><Clock size={18} style={{ color: 'var(--accent-sky)' }} /> Quick-Protect: 4-Hour Shift</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Going online for deliveries? Get instant on-demand weather coverage for your shift.</p>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-sky)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
             ₹9
          </div>
       </div>
       
       <button 
          onClick={handleActivate}
          disabled={loading}
          className="btn btn-primary" 
          style={{ width: '100%', background: 'var(--accent-sky)', color: '#000', border: 'none' }}
       >
          {loading ? <Loader2 size={18} className="spin" /> : <Zap size={18} />} 
          {loading ? 'Activating Policy...' : 'Slide to Activate Protection'}
       </button>
    </div>
  )
}
'''

content = content.replace("function Dashboard() {", widget_code + "\nfunction Dashboard() {")

# Inject it above the AIHealthWidget/WeatherWidget container
injection_point = r'<div style=\{\{ display: \'flex\', gap: \'16px\', flexWrap: \'wrap\' \}\}>'
injected_content = '<QuickProtectWidget workerId={worker?.id} onPurchase={() => window.location.reload()} />\n          <div style={{ display: \'flex\', gap: \'16px\', flexWrap: \'wrap\' }}>'

content = re.sub(injection_point, injected_content, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
