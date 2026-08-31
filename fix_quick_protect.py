import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Dashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add import PaymentModal if it doesn't exist
if 'import PaymentModal' not in content:
    content = content.replace("import { DashboardSkeleton } from '../components/ui/SkeletonLoader.jsx';", "import { DashboardSkeleton } from '../components/ui/SkeletonLoader.jsx';\nimport PaymentModal from '../components/PaymentModal.jsx';")

replacement = '''// ---- Quick Protect (On-Demand Shift Insurance) ----
function QuickProtectWidget({ workerId, onPurchase }) {
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Hardcode the shift plan details for the quick checkout
  const shiftPlan = { id: 7, planName: 'GigShield Shift Protect', premiumAmount: 9, billingCycle: 'SHIFT' };

  return (
    <>
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
            onClick={() => setShowPayment(true)}
            className="btn btn-primary" 
            style={{ width: '100%', background: 'var(--accent-sky)', color: '#000', border: 'none' }}
         >
            <Zap size={18} /> Slide to Activate Protection
         </button>
      </div>
      
      {showPayment && (
         <PaymentModal 
           plan={shiftPlan} 
           workerId={workerId} 
           onClose={() => setShowPayment(false)} 
           onSuccess={() => {
             setShowPayment(false);
             if (onPurchase) onPurchase();
           }} 
         />
      )}
    </>
  )
}'''

content = re.sub(r'// ---- Quick Protect \(On-Demand Shift Insurance\) ----[\s\S]*?\}\n\nfunction Dashboard', replacement + "\n\nfunction Dashboard", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
