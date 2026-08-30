import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'window\.prompt\(".*? AI DISASTER SIMULATION .*?\\n\\nEnter', 'window.prompt("🚨 AI DISASTER SIMULATION 🚨\\n\\nEnter', content)
content = re.sub(r'Active Policies.*?15,000\)', 'Active Policies ~ ₹15,000)', content)
content = re.sub(r'.*? EXCELLENT', '✅ EXCELLENT', content)
content = re.sub(r'.*? WARNING', '⚠️ WARNING', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
