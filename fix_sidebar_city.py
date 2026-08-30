import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\components\Sidebar.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("<MapPin size={10} />{worker?.city}", "<MapPin size={10} />{city || worker?.city}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
