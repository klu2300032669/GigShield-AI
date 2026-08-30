import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\components\AIChatBot.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded dark mode colors
content = content.replace("background: 'rgba(15, 15, 18, 0.95)'", "background: 'var(--bg-sidebar)'")
content = content.replace("color: 'white'", "color: 'var(--text-primary)'")
content = content.replace("color: msg.role === 'ai' ? 'rgba(255,255,255,0.9)' : 'white'", "color: 'var(--text-primary)'")
content = content.replace("background: msg.role === 'ai' ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.15)'", "background: msg.role === 'ai' ? 'var(--bg-secondary)' : 'var(--accent-emerald-glow)'")
content = content.replace("background: 'rgba(255,255,255,0.08)'", "background: 'var(--border-color)'")
content = content.replace("background: 'rgba(255,255,255,0.05)'", "background: 'var(--bg-secondary)'")
content = content.replace("border: '1px solid rgba(255,255,255,0.1)'", "border: '1px solid var(--border-color)'")
content = content.replace("borderBottom: '1px solid rgba(255,255,255,0.08)'", "borderBottom: '1px solid var(--border-color)'")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
