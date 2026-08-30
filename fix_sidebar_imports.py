import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\components\Sidebar.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { useLocation }' not in content:
    content = content.replace("import { useAuth } from '../context/AuthContext.jsx';", "import { useAuth } from '../context/AuthContext.jsx';\nimport { useLocation } from '../context/LocationContext.jsx';")

content = content.replace("const { worker, logout, isAdmin } = useAuth();", "const { worker, logout, isAdmin } = useAuth();\n  const { city } = useLocation();")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
