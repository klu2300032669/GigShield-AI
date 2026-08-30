import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    's,?': '🚨',
    'A- ,': '~ ₹',
    'dYY': '✅',
    '?"': '—'
}

for bad, good in replacements.items():
    if bad in content:
        content = content.replace(bad, good)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
