import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Settings.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('import { useLocation }'):
        new_lines.append("import { useLocation } from '../context/LocationContext.jsx';\n")
        new_lines.append("import { workerApi } from '../api/api.js';\n")
        new_lines.append("import { useToast } from '../context/ToastContext.jsx';\n")
    elif "import { workerApi }" in line or "import { useToast }" in line:
        pass # skip the broken lines
    else:
        new_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
