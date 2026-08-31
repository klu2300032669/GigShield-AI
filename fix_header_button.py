import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

bad_button = r'<button[^>]*onClick=\{async \(\) => \{[^}]*const targetCity = window\.prompt\("⚡ AI DISASTER SIMULATION ⚡[^}]*\}\}[^>]*>.*?Trigger AI Disaster Simulation.*?<\/button>'

content = re.sub(bad_button, '', content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
