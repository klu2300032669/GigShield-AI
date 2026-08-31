import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-backend\src\main\resources\data.sql'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the SHIFT plan
if "'GigShield Shift Protect'" not in content:
    new_plan = "\n('GigShield Shift Protect', 'On-Demand 4-hour micro-coverage for sudden weather changes while you are online.', 'ALL', 9.00, 300.00, 'SHIFT', true)"
    content = content.replace("('GigShield Total Weekly', 'Weekly comprehensive coverage for all environmental disruption types.', 'ALL', 79.00, 800.00, 'WEEKLY', true)", "('GigShield Total Weekly', 'Weekly comprehensive coverage for all environmental disruption types.', 'ALL', 79.00, 800.00, 'WEEKLY', true)," + new_plan)
    
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
