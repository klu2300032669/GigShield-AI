import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Settings.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("{worker?.city || city || '?\"'}", "{city || worker?.city || '—'}")
content = content.replace("{worker?.city || city || '—'}", "{city || worker?.city || '—'}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
