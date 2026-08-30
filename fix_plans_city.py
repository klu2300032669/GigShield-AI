import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Plans.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("city: worker?.city || 'Mumbai',", "city: city || worker?.city || 'Mumbai',")
if 'import { useLocation }' not in content:
    content = content.replace("import { useAuth }", "import { useAuth }\nimport { useLocation } from '../context/LocationContext.jsx'")
    content = content.replace("const { worker } = useAuth();", "const { worker } = useAuth();\n  const { city } = useLocation();")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
