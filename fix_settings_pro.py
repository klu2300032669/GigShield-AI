import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Settings.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_sections = '''
        {/* Connected Platforms */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'var(--accent-indigo-glow)', color: 'var(--accent-indigo)' }}>
              <Activity size={18} />
            </div>
            <h3>Connected Platforms</h3>
          </div>
          <div style={{ padding: '0 16px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Link your gig delivery platforms for automated trip verification and smart payouts.
          </div>
          {[
            { name: 'Zomato', status: 'Connected', color: '#e23744' },
            { name: 'Swiggy', status: 'Connect', color: '#fc8019' },
            { name: 'Zepto', status: 'Connect', color: '#31007a' },
            { name: 'Uber Moto', status: 'Connect', color: '#000000' }
          ].map(platform => (
            <div key={platform.name} className="settings-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: platform.color }} />
                <span style={{ fontWeight: 600 }}>{platform.name}</span>
              </div>
              {platform.status === 'Connected' ? (
                 <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
                   <CheckCircle2 size={12} /> Connected
                 </span>
              ) : (
                 <button className="btn btn-secondary btn-sm" onClick={() => showSuccess('OAuth Initiated', Connecting to  secure API...)}>Connect</button>
              )}
            </div>
          ))}
        </div>

        {/* Data & Privacy */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
              <Shield size={18} />
            </div>
            <h3>Data & Privacy</h3>
          </div>
          <div className="settings-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="settings-field-label" style={{ marginBottom: 2 }}>Export Account Data</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Download your policy and claim history as JSON</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const data = JSON.stringify({ worker, history: locationHistory }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = gigshield_data.json;
              a.click();
              showSuccess('Downloaded', 'Your data export has started.');
            }}>
              Download
            </button>
          </div>
          <div className="settings-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
            <div>
              <div className="settings-field-label" style={{ color: 'var(--accent-coral)', marginBottom: 2 }}>Danger Zone</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanently deactivate your GigShield account</div>
            </div>
            <button className="btn btn-sm" style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-coral)', border: '1px solid var(--accent-coral)' }} onClick={() => showError('Restricted', 'Active policies detected. Please contact support to deactivate.')}>
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'''

content = content.replace('      </div>\n    </div>\n  );\n}', new_sections)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
