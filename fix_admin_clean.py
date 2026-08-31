import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove handleAIAnalysis function
content = re.sub(r'const handleAIAnalysis = async \(claim\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# 2. Remove AI Fraud Analysis button from table
content = re.sub(r'<button\s*className="admin-action-btn view"\s*style=\{\{ background: \'rgba\(56, 189, 248, 0\.1\)\', color: \'var\(--accent-sky\)\' \}\}\s*onClick=\{\(\) => handleAIAnalysis\(claim\)\}.*?</button>', '', content, flags=re.DOTALL)

# 3. Remove AI Voice Briefing button
content = re.sub(r'<button[^>]*onClick=\{\(\) => \{[^}]*if \(!stats\) return showError\("Data not loaded yet"\);[^}]*\}\}[^>]*>.*?AI Voice Briefing.*?<\/button>', '', content, flags=re.DOTALL)

# 4. Add Loss Ratio Metric
loss_ratio_jsx = '''
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Activity size={20} style={{ color: (stats.totalPayoutAmount / (stats.totalRevenue || 1)) > 0.6 ? 'var(--accent-rose)' : 'var(--accent-sky)', marginBottom: 8 }} aria-hidden="true" />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (stats.totalPayoutAmount / (stats.totalRevenue || 1)) > 0.6 ? 'var(--accent-rose)' : 'var(--accent-sky)' }}>
              {((stats.totalPayoutAmount / (stats.totalRevenue || 1)) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Platform Loss Ratio</div>
          </div>
'''
if 'Platform Loss Ratio' not in content:
    content = content.replace('      {stats && (\n        <div className="metrics-grid stagger-children" style={{ gridTemplateColumns: \'repeat(auto-fit, minmax(200px, 1fr))\' }}>', 
                              '      {stats && (\n        <div className="metrics-grid stagger-children" style={{ gridTemplateColumns: \'repeat(auto-fit, minmax(200px, 1fr))\' }}>' + loss_ratio_jsx)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
