import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import AIChatBot from './components/AIChatBot.jsx';", '')
content = content.replace('<AIChatBot />', '')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
