import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the AI Voice Briefing button (more aggressive regex)
content = re.sub(r'<button\s*className="btn btn-outline"\s*style=\{\{ color: \'var\(--accent-teal\)\', borderColor: \'var\(--accent-teal\)\' \}\}.*?<Mic size=\{16\} /> AI Voice Briefing\s*</button>', '', content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
