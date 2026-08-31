import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Dashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove LiveTerminalLog definition
terminal_func = r'// ---- Live Smart Contract Terminal ----\s*function LiveTerminalLog.*?</div>\s*\);\s*\}'
content = re.sub(terminal_func, '', content, flags=re.DOTALL)

# Remove LiveTerminalLog usage
content = content.replace('<LiveTerminalLog city={city} />', '')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
