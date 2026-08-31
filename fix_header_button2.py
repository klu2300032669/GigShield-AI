import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

bad_button = r'<button \n            className="btn btn-primary" \n            style=\{\{ background: \'var\(--danger\)\', borderColor: \'var\(--danger\)\', boxShadow: \'0 0 15px rgba\(239, 68, 68, 0\.4\)\' \}\}.*?Trigger AI Disaster Simulation\n          </button>'

content = re.sub(bad_button, '', content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
